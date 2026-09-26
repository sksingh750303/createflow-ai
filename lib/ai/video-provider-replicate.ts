import "server-only";

// Real, ASYNCHRONOUS video-generation provider. Video generation takes
// minutes, not seconds, so this is a job-creation + polling/webhook
// pattern — never a synchronous request/response like text or images.
//
// The reference implementation below targets Replicate's prediction API
// (https://replicate.com/docs/reference/http — verify against current
// docs before going live). Replicate hosts many different video models,
// each with a different `input` schema, so `buildProviderInput()` below
// is the one place you adapt when you pick a specific model (e.g.
// "minimax/video-01", "kwaivgi/kling-v1.6", "google/veo-2", etc).
//
// To swap providers entirely (e.g. Runway, Luma, Pika), implement the
// same three functions with that provider's real endpoints — nothing
// outside this file needs to change, since API routes only ever call
// createVideoJob / getVideoJobStatus / cancelVideoJob.
//
// Configure via env:
//   VIDEO_PROVIDER        ("replicate" — extend this file for others)
//   VIDEO_API_KEY          (required)
//   VIDEO_MODEL_VERSION    (required — a Replicate model version id)
//   APP_URL                (used to build the webhook callback URL)

import { AiApiError } from "@/lib/ai/errors";
import { VideoGenerationInput, VideoJobHandle, VideoJobResult } from "@/lib/ai/types";

const REPLICATE_API_BASE = "https://api.replicate.com/v1";

function getApiKey(): string {
  const key = process.env.VIDEO_API_KEY;
  if (!key) {
    throw new AiApiError(
      "PROVIDER_ERROR",
      "Video AI provider is not configured (missing VIDEO_API_KEY).",
      500
    );
  }
  return key;
}

function getModelVersion(): string {
  const version = process.env.VIDEO_MODEL_VERSION;
  if (!version) {
    throw new AiApiError(
      "PROVIDER_ERROR",
      "No video model configured (missing VIDEO_MODEL_VERSION). Pick a model on " +
        "replicate.com and paste its version id here.",
      500
    );
  }
  return version;
}

/**
 * Maps our generic VideoGenerationInput onto the specific `input` object a
 * chosen Replicate model expects. Every video model's schema is different
 * — check "API" tab on the model's Replicate page and adjust field names
 * here. The fields below are a reasonable common denominator, not a
 * guarantee for any specific model.
 */
function buildProviderInput(input: VideoGenerationInput): Record<string, unknown> {
  const base: Record<string, unknown> = {
    prompt: input.prompt,
    aspect_ratio: input.aspectRatio,
  };
  if (input.mode === "image-to-video" && input.sourceImageUrl) {
    base.image = input.sourceImageUrl;
  }
  // Duration/camera/voice/music are UI concepts from the existing product;
  // only forward them if the chosen model actually accepts them — remove
  // any the model rejects, or fold them into `prompt` as descriptive text.
  base.duration = input.duration;
  base.motion = input.cameraMovement;
  base.style = input.style;
  return base;
}

export async function createVideoJob(
  input: VideoGenerationInput,
  _ownerId: string
): Promise<VideoJobHandle> {
  const webhookUrl = process.env.APP_URL
    ? `${process.env.APP_URL.replace(/\/$/, "")}/api/webhooks/video`
    : undefined;

  const res = await fetch(`${REPLICATE_API_BASE}/predictions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Token ${getApiKey()}`,
    },
    body: JSON.stringify({
      version: getModelVersion(),
      input: buildProviderInput(input),
      ...(webhookUrl
        ? { webhook: webhookUrl, webhook_events_filter: ["completed"] }
        : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // eslint-disable-next-line no-console
    console.error("[ai/video] provider create error", res.status, body);
    throw new AiApiError("PROVIDER_ERROR", "The video provider failed to start the job.", 502);
  }

  const data = await res.json();
  return { providerJobId: data.id as string, status: "queued" };
}

export async function getVideoJobStatus(providerJobId: string): Promise<VideoJobResult> {
  const res = await fetch(`${REPLICATE_API_BASE}/predictions/${providerJobId}`, {
    headers: { authorization: `Token ${getApiKey()}` },
  });

  if (!res.ok) {
    throw new AiApiError("PROVIDER_ERROR", "Could not fetch video job status.", 502);
  }

  const data = await res.json();
  return mapReplicateStatus(data);
}

export async function cancelVideoJob(providerJobId: string): Promise<void> {
  const res = await fetch(`${REPLICATE_API_BASE}/predictions/${providerJobId}/cancel`, {
    method: "POST",
    headers: { authorization: `Token ${getApiKey()}` },
  });
  if (!res.ok && res.status !== 404) {
    throw new AiApiError("PROVIDER_ERROR", "Could not cancel the video job.", 502);
  }
}

/** Shared by the polling route and the webhook handler so status mapping stays in one place. */
export function mapReplicateStatus(data: {
  status: string;
  output?: string | string[];
  error?: string;
}): VideoJobResult {
  switch (data.status) {
    case "starting":
      return { status: "queued" };
    case "processing":
      return { status: "processing" };
    case "succeeded": {
      const output = Array.isArray(data.output) ? data.output[0] : data.output;
      if (!output) {
        return { status: "failed", error: "Provider reported success with no output file." };
      }
      return { status: "completed", outputUrl: output };
    }
    case "failed":
      return { status: "failed", error: data.error || "Video generation failed." };
    case "canceled":
      return { status: "cancelled" };
    default:
      return { status: "processing" };
  }
}
