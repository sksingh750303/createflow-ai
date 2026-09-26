import "server-only";

// Real text-generation + chat implementation — Hugging Face's
// OpenAI-compatible router, accessed through the official `openai` SDK
// (rather than hand-rolled fetch/SSE parsing) so this gets the SDK's
// battle-tested request handling, error types, and streaming iterator
// for free. Docs: https://huggingface.co/docs/inference-providers/en/guides/openai-compat
//
// The API key (HUGGINGFACE_API_KEY) is read from server-side env only —
// this file has `import "server-only"` at the top, which makes Next.js
// throw a build error if anything ever tries to import it from a Client
// Component, so the key can never leak into the browser bundle.

import OpenAI from "openai";
import { AiApiError } from "@/lib/ai/errors";
import { TextGenerationInput, TextGenerationResult } from "@/lib/ai/types";
import { buildTextPrompt } from "@/lib/ai/prompts";
import { getHuggingFaceApiKey } from "@/lib/ai/huggingface-client";

const DEFAULT_TEXT_MODEL = "openai/gpt-oss-120b";

function getTextModel(): string {
  return process.env.HF_TEXT_MODEL || DEFAULT_TEXT_MODEL;
}

let client: OpenAI | null = null;

function getClient(): OpenAI {
  // getHuggingFaceApiKey() throws a clear AiApiError (never a raw SDK
  // error, never the key itself) if HUGGINGFACE_API_KEY isn't set.
  const apiKey = getHuggingFaceApiKey();
  if (!client) {
    client = new OpenAI({ baseURL: "https://router.huggingface.co/v1", apiKey });
  }
  return client;
}

/** Maps an OpenAI-SDK error into our AiApiError shape without ever leaking the API key. */
function toAiError(err: unknown): AiApiError {
  if (err instanceof AiApiError) return err;

  if (err instanceof OpenAI.APIError) {
    // eslint-disable-next-line no-console
    console.error("[ai/text] Hugging Face API error:", err.status, err.message);
    if (err.status === 429) {
      return new AiApiError("RATE_LIMITED", "The AI provider is rate-limiting requests — please wait a moment and try again.", 429);
    }
    if (err.status === 404) {
      return new AiApiError(
        "PROVIDER_ERROR",
        `Model "${getTextModel()}" isn't available via Hugging Face's router — pick another one at https://router.huggingface.co/v1/models and set HF_TEXT_MODEL.`,
        502
      );
    }
    if (err.status === 401 || err.status === 403) {
      return new AiApiError(
        "PROVIDER_ERROR",
        "Hugging Face rejected the API key — make sure HUGGINGFACE_API_KEY is a fine-grained token with \"Make calls to Inference Providers\" checked.",
        502
      );
    }
    return new AiApiError("PROVIDER_ERROR", "The AI provider failed to generate a result.", 502);
  }

  // eslint-disable-next-line no-console
  console.error("[ai/text] unexpected error calling Hugging Face:", err);
  return new AiApiError("PROVIDER_ERROR", "The AI provider failed to generate a result.", 502);
}

export async function generateTextReal(input: TextGenerationInput): Promise<TextGenerationResult> {
  const { system, user } = buildTextPrompt(input);

  try {
    const completion = await getClient().chat.completions.create({
      model: getTextModel(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      max_tokens: 1200,
      stream: false,
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content || !content.trim()) {
      throw new AiApiError("GENERATION_FAILED", "The AI provider returned an empty result.", 502);
    }
    return { content: content.trim() };
  } catch (err) {
    throw toAiError(err);
  }
}

/**
 * REAL token-by-token streaming via Hugging Face's OpenAI-compatible SSE
 * stream (`stream: true`), consumed through the `openai` SDK's async
 * iterator (`for await (const chunk of stream)`) — not simulated, not
 * buffered-then-chunked. Each yielded value is a `delta.content` piece
 * exactly as the model produced it.
 */
export async function* streamChatReal(params: {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
}): AsyncGenerator<string> {
  let stream;
  try {
    stream = await getClient().chat.completions.create({
      model: getTextModel(),
      messages: [{ role: "system", content: params.system }, ...params.messages],
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });
  } catch (err) {
    throw toAiError(err);
  }

  try {
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    }
  } catch (err) {
    // Stream started but broke partway through — surface as a normal
    // provider error so the route's existing failure handling
    // (refund + a persisted, visible error message) takes over.
    throw toAiError(err);
  }
}
