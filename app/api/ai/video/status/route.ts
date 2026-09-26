import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth-guard";
import { toErrorResponse, AiApiError } from "@/lib/ai/errors";
import { getAdminDb } from "@/lib/firebase/admin";
import { getVideoJobStatus } from "@/lib/ai/provider";
import { applyVideoJobResult } from "@/lib/ai/video-jobs";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const authed = await requireAuth(req);
    const generationId = req.nextUrl.searchParams.get("generationId");
    if (!generationId) {
      throw new AiApiError("INVALID_INPUT", "generationId is required.", 400);
    }

    const db = getAdminDb();
    const ref = db.collection("generations").doc(generationId);
    const snap = await ref.get();
    if (!snap.exists) throw new AiApiError("NOT_FOUND", "Generation not found.", 404);

    const data = snap.data()!;
    if (data.ownerId !== authed.uid) {
      throw new AiApiError("FORBIDDEN", "You don't have access to this generation.", 403);
    }

    // Already terminal (e.g. a webhook already finalized it) — just return it.
    if (["completed", "failed", "cancelled"].includes(data.status)) {
      return NextResponse.json({
        status: data.status,
        videoUrl: data.videoUrl ?? null,
        errorMessage: data.errorMessage ?? null,
      });
    }

    if (!data.providerJobId) {
      return NextResponse.json({ status: data.status });
    }

    // Poll the provider directly — this is the fallback path for
    // providers without webhooks, and a safety net if a webhook is ever
    // missed for providers that do have them.
    const result = await getVideoJobStatus(data.providerJobId);
    await applyVideoJobResult(generationId, result);

    const updated = await ref.get();
    const updatedData = updated.data()!;
    return NextResponse.json({
      status: updatedData.status,
      videoUrl: updatedData.videoUrl ?? null,
      errorMessage: updatedData.errorMessage ?? null,
      progress: result.progress,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
