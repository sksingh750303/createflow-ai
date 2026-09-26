import "server-only";

// EXPERIMENTAL: Hugging Face text-to-video via the Inference API.
//
// Read this before relying on it: genuinely free, production-grade video
// generation is not really available from ANY provider today (video
// models are expensive to run) — this integration exists so the whole
// stack (prompt → generate → Supabase Storage → Firestore → player) works
// end-to-end on a single free-tier account, using small/low-resolution
// open video models. Expect short clips, low resolution, and that the
// default model id may need to be swapped for whatever free text-to-video
// model is currently hosted on Hugging Face's serverless tier — check
// https://huggingface.co/models?pipeline_tag=text-to-video and update
// HF_VIDEO_MODEL if the default below has been deprecated.
//
// Unlike Replicate's async job/webhook pattern, HF's serverless inference
// is a single synchronous call — there's no job id or status endpoint to
// poll. So `createVideoJob` below actually performs the full generation
// and upload before returning, and reports back as already "completed" (or
// throws on failure, which the API route turns into a refund). See
// app/api/ai/video/route.ts for how it handles a provider that finishes
// synchronously vs. one (Replicate) that returns a pending job.

import { AiApiError } from "@/lib/ai/errors";
import { VideoGenerationInput, VideoJobHandle, VideoJobResult } from "@/lib/ai/types";
import { callHuggingFace } from "@/lib/ai/huggingface-client";
import { STORAGE_BUCKETS, uploadToSupabaseStorage } from "@/lib/supabase/server";
import { generateId } from "@/lib/utils";

const DEFAULT_VIDEO_MODEL = "ali-vilab/text-to-video-ms-1.7b";

function getVideoModel(): string {
  return process.env.HF_VIDEO_MODEL || DEFAULT_VIDEO_MODEL;
}

export async function createVideoJob(
  input: VideoGenerationInput,
  ownerId: string
): Promise<VideoJobHandle> {
  const prompt = `${input.prompt}. Style: ${input.style}.`;

  let res: Response;
  try {
    res = await callHuggingFace({
      model: getVideoModel(),
      binary: true,
      body: { inputs: prompt },
      maxRetries: 2, // video models are slow to warm up — fail a bit faster than text/image
    });
  } catch (err) {
    if (err instanceof AiApiError) throw err;
    throw new AiApiError(
      "PROVIDER_ERROR",
      "Video generation failed. Free text-to-video models are limited — " +
        "consider switching VIDEO_PROVIDER=replicate for a more reliable paid option.",
      502
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") || "video/mp4";
  const jobId = generateId("hf");

  const uploaded = await uploadToSupabaseStorage({
    bucket: STORAGE_BUCKETS.videos,
    path: `${ownerId}/${jobId}/video.mp4`,
    data: arrayBuffer,
    contentType,
    upsert: true,
  });

  return { providerJobId: jobId, status: "completed", outputUrl: uploaded.publicUrl };
}

// HF's synchronous call means the job above is already finished by the
// time it returns — these exist only to satisfy the shared provider
// interface for code paths that still poll (they're effectively unused in
// practice, since the Firestore doc is already terminal). Signatures
// intentionally match video-provider-replicate.ts exactly so the
// dispatcher in video-provider.ts can call either backend interchangeably.
export async function getVideoJobStatus(_providerJobId: string): Promise<VideoJobResult> {
  return { status: "completed" };
}

export async function cancelVideoJob(_providerJobId: string): Promise<void> {
  // No-op — nothing to cancel once the synchronous call has returned.
}
