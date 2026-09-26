import "server-only";

export interface TextGenerationInput {
  tool: string; // tool slug, e.g. "ai-blog-writer", "seo-article-writer"
  topic: string;
  tone?: string;
  language?: string;
  length?: string;
  keywords?: string;
  instructions?: string;
  brandVoiceContext?: string; // optional Brand Kit context, injected server-side
}

export interface TextGenerationResult {
  content: string;
  tokensUsed?: number;
}

export interface ChatMessageInput {
  role: "user" | "assistant";
  content: string;
}

export interface ImageGenerationInput {
  prompt: string;
  style: string;
  aspectRatio: string;
  quality: string;
  count: number;
}

export interface ImageGenerationResult {
  images: { url: string; contentType: string }[];
}

export interface VideoGenerationInput {
  mode: "text-to-video" | "image-to-video" | "script-to-video";
  prompt: string;
  duration: string;
  aspectRatio: string;
  style: string;
  cameraMovement: string;
  voice: string;
  music: string;
  sourceImageUrl?: string; // for image-to-video
}

export interface VideoJobHandle {
  providerJobId: string;
  status: "queued" | "processing" | "completed" | "failed";
  /** Set only when a provider (e.g. a synchronous one) completes the job immediately. */
  outputUrl?: string;
  error?: string;
}

export interface VideoJobResult {
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  outputUrl?: string;
  error?: string;
  progress?: number; // 0-100, ONLY set if the provider actually reports it
}
