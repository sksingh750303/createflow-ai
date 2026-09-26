"use client";

import { getIdToken } from "@/lib/firebase/auth";
import { AiErrorPayload } from "@/types";

export class ApiClientError extends Error {
  code: AiErrorPayload["code"];
  status: number;
  constructor(code: AiErrorPayload["code"], message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await getIdToken();
  if (!token) {
    throw new ApiClientError("AUTH_REQUIRED", "Please sign in to continue.", 401);
  }
  return { "content-type": "application/json", authorization: `Bearer ${token}` };
}

/** POST/GET JSON against one of our own /api/* routes, attaching the Firebase ID token. */
export async function callApi<T = unknown>(
  path: string,
  options: { method?: "GET" | "POST"; body?: unknown } = {}
): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(path, {
    method: options.method ?? (options.body ? "POST" : "GET"),
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const err = payload?.error as AiErrorPayload | undefined;
    throw new ApiClientError(
      err?.code ?? "PROVIDER_ERROR",
      err?.message ?? "Something went wrong. Please try again.",
      res.status
    );
  }

  return res.json();
}

/**
 * Streams a chat reply from /api/ai/chat, invoking `onChunk` as text
 * arrives. Returns the full reply text and the (possibly newly created)
 * conversation id, read from the `x-conversation-id` response header.
 */
export async function streamChatApi(params: {
  conversationId: string | null;
  message: string;
  onChunk: (chunk: string) => void;
}): Promise<{ fullText: string; conversationId: string }> {
  const headers = await authHeaders();
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers,
    body: JSON.stringify({ conversationId: params.conversationId, message: params.message }),
  });

  if (!res.ok || !res.body) {
    const payload = await res.json().catch(() => null);
    const err = payload?.error as AiErrorPayload | undefined;
    throw new ApiClientError(
      err?.code ?? "PROVIDER_ERROR",
      err?.message ?? "The assistant failed to respond.",
      res.status
    );
  }

  const conversationId = res.headers.get("x-conversation-id") ?? params.conversationId ?? "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    fullText += chunk;
    params.onChunk(chunk);
  }

  return { fullText, conversationId };
}
