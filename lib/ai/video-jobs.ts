import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { STORAGE_BUCKETS, uploadRemoteFileToSupabase } from "@/lib/supabase/server";
import { refundCredits } from "@/lib/credits";
import { CREDIT_COSTS } from "@/lib/billing/plans";
import { VideoJobResult } from "@/lib/ai/types";

/**
 * Applies a provider status update to a Firestore `generations` doc.
 * Idempotent: if the doc is already in a terminal state (completed/failed/
 * cancelled), this is a no-op — safe to call from both the polling route
 * AND a webhook that might fire more than once for the same job.
 */
export async function applyVideoJobResult(generationId: string, result: VideoJobResult) {
  const db = getAdminDb();
  const ref = db.collection("generations").doc(generationId);
  const snap = await ref.get();
  if (!snap.exists) return;

  const current = snap.data();
  if (current?.status === "completed" || current?.status === "failed" || current?.status === "cancelled") {
    return; // Already finalized — ignore late/duplicate updates.
  }

  if (result.status === "queued" || result.status === "processing") {
    await ref.update({ status: result.status });
    return;
  }

  if (result.status === "completed" && result.outputUrl) {
    // A synchronous provider (e.g. the Hugging Face backend) may have
    // already uploaded directly to our own Supabase bucket and handed
    // back a public URL from it — detect that and skip a redundant
    // re-fetch-and-re-upload round trip.
    const alreadyOurs =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      result.outputUrl.startsWith(process.env.NEXT_PUBLIC_SUPABASE_URL as string);

    const { publicUrl, path, bucket } = alreadyOurs
      ? { publicUrl: result.outputUrl, path: null, bucket: STORAGE_BUCKETS.videos }
      : await uploadRemoteFileToSupabase({
          bucket: STORAGE_BUCKETS.videos,
          path: `${current?.ownerId}/${generationId}/video.mp4`,
          sourceUrl: result.outputUrl,
        });

    await ref.update({
      status: "completed",
      videoUrl: publicUrl,
    });

    await db.collection("files").add({
      ownerId: current?.ownerId,
      generationId,
      projectId: current?.projectId ?? null,
      storagePath: path,
      bucket,
      publicUrl,
      mimeType: "video/mp4",
      size: 0,
      createdAt: FieldValue.serverTimestamp(),
    });
    return;
  }

  if (result.status === "failed" || result.status === "cancelled") {
    await ref.update({
      status: result.status,
      errorMessage: result.error ?? (result.status === "cancelled" ? "Cancelled by user." : "Video generation failed."),
    });
    // The job was charged up-front at creation — refund since it didn't
    // deliver a usable video.
    await refundCredits({
      uid: current?.ownerId,
      amount: CREDIT_COSTS.videoGeneration,
      generationId,
      description: `Refund — video ${result.status}`,
    }).catch(() => {
      // Non-fatal: if this somehow fails, an admin can reconcile from the
      // creditTransactions collection using the generationId.
    });
  }
}
