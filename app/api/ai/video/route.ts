import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/api/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { chargeCredits, refundCredits } from "@/lib/credits";
import { CREDIT_COSTS } from "@/lib/billing/plans";
import { createVideoJob } from "@/lib/ai/provider";
import { applyVideoJobResult } from "@/lib/ai/video-jobs";
import { toErrorResponse, AiApiError } from "@/lib/ai/errors";
import { getAdminDb } from "@/lib/firebase/admin";

// A synchronous provider (the default Hugging Face backend) does the
// full generation inside this request — give it real headroom. (Ignored
// by hosts that don't support per-route duration config; on those, keep
// an eye on your platform's own function timeout if HF video feels slow.)
export const maxDuration = 120;
export const runtime = "nodejs";

const bodySchema = z.object({
  mode: z.enum(["text-to-video", "image-to-video", "script-to-video"]),
  prompt: z.string().min(1, "Describe your video first.").max(2000),
  duration: z.string().max(20),
  aspectRatio: z.string().max(20),
  style: z.string().max(60),
  cameraMovement: z.string().max(60),
  voice: z.string().max(60),
  music: z.string().max(60),
  sourceImageUrl: z.string().url().optional(),
  projectId: z.string().max(200).nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const authed = await requireAuth(req);
    // Video jobs are expensive — a tighter limit than text/image.
    await checkRateLimit({ uid: authed.uid, bucket: "ai-video", limit: 10, windowSeconds: 300 });

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      throw new AiApiError("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid input.", 400);
    }
    const input = parsed.data;
    const cost = CREDIT_COSTS.videoGeneration;

    const db = getAdminDb();
    const genRef = db.collection("generations").doc();

    // Video billing model: charge up front when the job is queued. If the
    // provider job later fails/cancels, applyVideoJobResult() (called from
    // both the polling route and the webhook) refunds automatically.
    await chargeCredits({
      uid: authed.uid,
      amount: cost,
      generationId: genRef.id,
      description: `Video generation: ${input.mode}`,
    });

    await genRef.set({
      ownerId: authed.uid,
      type: "Video",
      title: input.prompt,
      prompt: input.prompt,
      content: `${input.duration} · ${input.style} · ${input.aspectRatio}`,
      status: "queued",
      creditsUsed: cost,
      projectId: input.projectId ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });

    try {
      const job = await createVideoJob(input, authed.uid);

      if (job.status === "completed" || job.status === "failed") {
        // Synchronous provider (e.g. Hugging Face) — finalize immediately
        // via the same idempotent path the poller/webhook use, so upload/
        // refund logic isn't duplicated here.
        await applyVideoJobResult(genRef.id, {
          status: job.status,
          outputUrl: job.outputUrl,
          error: job.error,
        });
      } else {
        await genRef.update({ providerJobId: job.providerJobId, status: job.status });
      }

      const finalSnap = await genRef.get();
      return NextResponse.json({ generationId: genRef.id, status: finalSnap.data()?.status ?? job.status });
    } catch (err) {
      await genRef.update({
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "Failed to start video job.",
      });
      await refundCredits({
        uid: authed.uid,
        amount: cost,
        generationId: genRef.id,
        description: "Refund — video job failed to start",
      });
      throw err;
    }
  } catch (err) {
    return toErrorResponse(err);
  }
}
