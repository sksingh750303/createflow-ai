import "server-only";

// Real image-generation implementation — Hugging Face Inference API, via
// the router.huggingface.co/hf-inference endpoint (see
// lib/ai/huggingface-client.ts — the old api-inference.huggingface.co
// host is retired). Docs: https://huggingface.co/docs/inference-providers
// Default model (FLUX.1-schnell) is Apache-2.0 licensed and commonly
// available on the free serverless tier — verify at
// https://huggingface.co/models?pipeline_tag=text-to-image before going
// live, since specific free-tier model availability can change.

import { AiApiError } from "@/lib/ai/errors";
import { ImageGenerationInput, ImageGenerationResult } from "@/lib/ai/types";
import { callHuggingFace } from "@/lib/ai/huggingface-client";

const DEFAULT_IMAGE_MODEL = "black-forest-labs/FLUX.1-schnell";

// HF text-to-image models generally accept free-form width/height rather
// than named aspect ratios — map our UI's ratios to sane pixel sizes
// (kept multiples of 8, which most diffusion models require).
const ASPECT_TO_SIZE: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1344, height: 768 },
  "9:16": { width: 768, height: 1344 },
  "4:3": { width: 1152, height: 896 },
};

function getImageModel(): string {
  return process.env.HF_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
}

async function generateOneImage(prompt: string, size: { width: number; height: number }): Promise<string> {
  const res = await callHuggingFace({
    model: getImageModel(),
    binary: true,
    body: {
      inputs: prompt,
      parameters: { width: size.width, height: size.height },
    },
  });

  const arrayBuffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") || "image/png";
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return `data:${contentType};base64,${base64}`;
}

export async function generateImagesReal(
  input: ImageGenerationInput
): Promise<ImageGenerationResult> {
  const size = ASPECT_TO_SIZE[input.aspectRatio] || ASPECT_TO_SIZE["1:1"];
  const fullPrompt = `${input.prompt}. Style: ${input.style}. Quality: ${input.quality}.`;
  const count = Math.min(Math.max(input.count, 1), 4);

  // HF's free inference endpoint generates one image per call — run the
  // requested count in parallel rather than expecting a `n` parameter.
  const images = await Promise.all(
    Array.from({ length: count }).map(async () => {
      const url = await generateOneImage(fullPrompt, size);
      return { url, contentType: "image/png" };
    })
  ).catch((err) => {
    if (err instanceof AiApiError) throw err;
    throw new AiApiError("GENERATION_FAILED", "Image generation failed.", 502);
  });

  return { images };
}
