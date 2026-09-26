import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getAdminDb } from "@/lib/firebase/admin";
import { mapReplicateStatus } from "@/lib/ai/video-provider";
import { applyVideoJobResult } from "@/lib/ai/video-jobs";

export const runtime = "nodejs";

// This webhook is only relevant when VIDEO_PROVIDER=replicate — the
// default Hugging Face video backend (lib/ai/video-provider-huggingface.ts)
// generates synchronously within the /api/ai/video request itself and
// never calls back here, since HF's free tier has no job-queue/webhook
// concept. Nothing needs to change here to use the default provider; this
// route just sits unused until/unless you opt into VIDEO_PROVIDER=replicate.

/**
 * Verifies the webhook signature using a shared-secret HMAC-SHA256 scheme.
 *
 * IMPORTANT: this is a generic reference implementation, not a specific
 * provider's exact scheme — Replicate (like many providers) signs
 * webhooks using the svix format (`webhook-id` / `webhook-timestamp` /
 * `webhook-signature` headers, base64 HMAC over `id.timestamp.body`).
 * Verify against the current docs for whichever provider you use
 * (https://replicate.com/docs/webhooks for Replicate) and adjust this
 * function to match exactly before relying on it in production — do not
 * ship with signature verification unverified against real payloads.
 */
function verifyWebhookSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  } catch {
    return false; // length mismatch, etc. — treat as invalid, not an error
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.VIDEO_WEBHOOK_SECRET;
  if (!secret) {
    // eslint-disable-next-line no-console
    console.error("[webhooks/video] VIDEO_WEBHOOK_SECRET is not configured — rejecting webhook.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-webhook-signature") || req.headers.get("webhook-signature");

  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    // eslint-disable-next-line no-console
    console.warn("[webhooks/video] rejected webhook with invalid/missing signature.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: { id: string; status: string; output?: string | string[]; error?: string };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const db = getAdminDb();
  const matches = await db
    .collection("generations")
    .where("providerJobId", "==", payload.id)
    .limit(1)
    .get();

  if (matches.empty) {
    // Unknown job id — acknowledge with 200 so the provider doesn't retry
    // forever, but log it since it likely means a stale/foreign webhook.
    // eslint-disable-next-line no-console
    console.warn("[webhooks/video] no generation found for providerJobId", payload.id);
    return NextResponse.json({ received: true });
  }

  const generationId = matches.docs[0].id;
  const result = mapReplicateStatus(payload);
  await applyVideoJobResult(generationId, result);

  return NextResponse.json({ received: true });
}
