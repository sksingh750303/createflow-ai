import "server-only";

// Video provider DISPATCHER. VIDEO_PROVIDER selects which backend handles
// video generation — defaults to "huggingface" (free/single-provider,
// synchronous, experimental — see video-provider-huggingface.ts for
// caveats). Set VIDEO_PROVIDER=replicate for the more capable, paid,
// truly-async job/webhook path instead (video-provider-replicate.ts).
//
// Every route in this app calls ONLY the three functions re-exported
// below — never a specific backend file directly — so switching providers
// is a one-line env change, not a code change.

import { VideoGenerationInput, VideoJobHandle, VideoJobResult } from "@/lib/ai/types";
import * as huggingFaceVideo from "@/lib/ai/video-provider-huggingface";
import * as replicateVideo from "@/lib/ai/video-provider-replicate";

export { mapReplicateStatus } from "@/lib/ai/video-provider-replicate";

function backend() {
  const provider = (process.env.VIDEO_PROVIDER || "huggingface").toLowerCase();
  return provider === "replicate" ? replicateVideo : huggingFaceVideo;
}

export async function createVideoJob(
  input: VideoGenerationInput,
  ownerId: string
): Promise<VideoJobHandle> {
  return backend().createVideoJob(input, ownerId);
}

export async function getVideoJobStatus(providerJobId: string): Promise<VideoJobResult> {
  return backend().getVideoJobStatus(providerJobId);
}

export async function cancelVideoJob(providerJobId: string): Promise<void> {
  return backend().cancelVideoJob(providerJobId);
}
