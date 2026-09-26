import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { AiApiError } from "@/lib/ai/errors";

/**
 * Simple fixed-window rate limiter backed by Firestore, keyed by
 * `${uid}:${bucket}:${windowStart}`. This is fine for moderate traffic,
 * but Firestore document writes have their own throughput ceiling per
 * document — for high-traffic production use, swap this implementation
 * for Redis (e.g. Upstash Redis + `@upstash/ratelimit`) without changing
 * any call site, since `checkRateLimit` is the only exported function.
 */
export async function checkRateLimit(params: {
  uid: string;
  bucket: string; // e.g. "ai-text", "ai-video", "billing-checkout"
  limit: number;
  windowSeconds: number;
}) {
  const { uid, bucket, limit, windowSeconds } = params;
  const windowStart = Math.floor(Date.now() / 1000 / windowSeconds) * windowSeconds;
  const docId = `${uid}_${bucket}_${windowStart}`;
  const ref = getAdminDb().collection("rateLimits").doc(docId);

  const result = await getAdminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const count = (snap.exists ? (snap.data()?.count as number) : 0) ?? 0;

    if (count >= limit) {
      return { allowed: false, count };
    }

    tx.set(
      ref,
      {
        uid,
        bucket,
        windowStart,
        count: FieldValue.increment(1),
        expiresAt: new Date((windowStart + windowSeconds) * 1000),
      },
      { merge: true }
    );
    return { allowed: true, count: count + 1 };
  });

  if (!result.allowed) {
    throw new AiApiError(
      "RATE_LIMITED",
      "You're generating too quickly — please wait a moment and try again.",
      429
    );
  }
}
