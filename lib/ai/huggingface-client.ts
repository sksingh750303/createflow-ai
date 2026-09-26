import "server-only";

// Shared client for the Hugging Face Inference API — the single provider
// this app uses for text, chat, image, and (experimentally) video, all
// under one API key from one company/account.
//
// IMPORTANT: Hugging Face retired api-inference.huggingface.co in favor of
// a unified router endpoint as part of their "Inference Providers"
// migration — using the old hostname now fails with a DNS error (it's
// gone, not just deprecated). This client uses the current replacement,
// https://router.huggingface.co/hf-inference, which serves the same
// request/response shape as the old API for the tasks this app uses
// (text-generation, text-to-image). Docs:
// https://huggingface.co/docs/inference-providers — verify this again if
// you hit errors, since Hugging Face has changed this more than once.
//
// Also note: your token needs the "Make calls to Inference Providers"
// permission (fine-grained tokens) — a plain "Read" token may be
// rejected. See docs/SETUP_GUIDE.md §3.1 for the exact token-creation link.

import dns from "node:dns";
import { AiApiError } from "@/lib/ai/errors";

// Node's fetch (undici) sometimes resolves a hostname to an IPv6 address
// that isn't actually routable on the local network/ISP, which fails with
// a generic "TypeError: fetch failed" — even though the exact same host
// loads fine in a browser (browsers try both address families and
// silently fall back; Node's fetch often doesn't). Forcing IPv4-first
// resolution for this whole process fixes that class of failure. This
// runs once, the first time any file imports this module — since every
// Hugging Face call in this app (text/chat/image/video) goes through
// here, one place is enough to cover all of them.
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Older Node versions (<18) don't have this API — safe to ignore; on
  // those, use the NODE_OPTIONS=--dns-result-order=ipv4first flag instead.
}

const HF_API_BASE = "https://router.huggingface.co/hf-inference/models";

export function getHuggingFaceApiKey(): string {
  const key = process.env.HUGGINGFACE_API_KEY;
  if (!key) {
    throw new AiApiError(
      "PROVIDER_ERROR",
      "AI provider is not configured (missing HUGGINGFACE_API_KEY).",
      500
    );
  }
  return key;
}

interface CallOptions {
  model: string;
  body: unknown;
  /** Expect raw binary back (images/video) instead of JSON. */
  binary?: boolean;
  /** Max attempts if the model is still "warming up" (HF returns 503 while loading a cold model). */
  maxRetries?: number;
}

/**
 * Calls a Hugging Face Inference API model. Free-tier "serverless" models
 * are sometimes cold and return a 503 with `{ estimated_time }` while they
 * spin up — this retries a few times with that estimated wait instead of
 * failing immediately, which is normal/expected HF behavior, not an error.
 */
export async function callHuggingFace(options: CallOptions): Promise<Response> {
  const { model, body, binary = false, maxRetries = 3 } = options;
  const apiKey = getHuggingFaceApiKey();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(`${HF_API_BASE}/${model}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        accept: binary ? "*/*" : "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) return res;

    if (res.status === 503 && attempt < maxRetries) {
      const info = await res.json().catch(() => null);
      const waitMs = Math.min(15000, Math.round((info?.estimated_time ?? 5) * 1000));
      // eslint-disable-next-line no-console
      console.warn(`[huggingface] model "${model}" warming up — retrying in ${waitMs}ms`);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    const text = await res.text().catch(() => "");
    // eslint-disable-next-line no-console
    console.error(`[huggingface] ${model} error`, res.status, text);
    throw new AiApiError(
      "PROVIDER_ERROR",
      res.status === 404
        ? `Model "${model}" was not found on Hugging Face — check the model id / your access to it.`
        : "The AI provider failed to generate a result.",
      502
    );
  }

  throw new AiApiError("GENERATION_TIMEOUT", "The AI model is still warming up — please try again shortly.", 504);
}
