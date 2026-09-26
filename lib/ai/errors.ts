import { NextResponse } from "next/server";
import { AiErrorPayload } from "@/types";

export class AiApiError extends Error {
  code: AiErrorPayload["code"];
  status: number;

  constructor(code: AiErrorPayload["code"], message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/** Converts any thrown error into a consistent JSON error response, logging technical detail server-side. */
export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof AiApiError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message } satisfies AiErrorPayload },
      { status: err.status }
    );
  }

  // Unknown/unexpected error — log full detail server-side, but never leak
  // internals (stack traces, provider error bodies, etc.) to the client.
  // eslint-disable-next-line no-console
  console.error("[api] unhandled error:", err);

  return NextResponse.json(
    {
      error: {
        code: "PROVIDER_ERROR",
        message: "Something went wrong generating your content. Please try again.",
      } satisfies AiErrorPayload,
    },
    { status: 500 }
  );
}
