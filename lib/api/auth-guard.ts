import "server-only";

import { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { getDefaultPlan } from "@/lib/billing/plans";
import { UserDoc } from "@/types";
import { AiApiError } from "@/lib/ai/errors";

export interface AuthedRequest {
  uid: string;
  email: string | null;
  userDoc: UserDoc;
}

/**
 * Verifies the `Authorization: Bearer <Firebase ID token>` header on an
 * incoming API request, and returns the caller's uid + their Firestore
 * user document (creating it with default free-plan values if it somehow
 * doesn't exist yet — e.g. a user created via a provider that skipped the
 * client-side bootstrap in lib/firebase/auth.ts).
 *
 * Every /api/ai/* and /api/billing/* route should call this FIRST, before
 * doing anything else — never trust a uid/plan/credits value sent in the
 * request body.
 */
export async function requireAuth(req: NextRequest): Promise<AuthedRequest> {
  const header = req.headers.get("authorization") || req.headers.get("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) {
    throw new AiApiError("AUTH_REQUIRED", "Sign in to continue.", 401);
  }

  // Fail with a CLEAR, distinct error when the server-side Admin SDK
  // simply isn't configured — this is a setup problem, not an expired
  // session, and surfacing it as "sign in again" sends people in circles
  // re-logging-in forever when the real fix is their .env.local.
  if (!isFirebaseAdminConfigured()) {
    // eslint-disable-next-line no-console
    console.error(
      "[auth] Firebase Admin is not configured — set FIREBASE_PROJECT_ID, " +
        "FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local, then restart the dev server."
    );
    throw new AiApiError(
      "AUTH_REQUIRED",
      "Server isn't configured to verify sign-in yet (missing Firebase Admin credentials) — this is a setup issue, not an expired session. See the server terminal log for details.",
      500
    );
  }

  let decoded;
  try {
    decoded = await getAdminAuth().verifyIdToken(token);
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    // Always log the real reason server-side — the client only ever sees
    // a generic message, so this log is the only way to actually debug
    // auth failures.
    // eslint-disable-next-line no-console
    console.error("[auth] verifyIdToken failed:", code, err instanceof Error ? err.message : err);

    if (code === "auth/id-token-expired") {
      throw new AiApiError("AUTH_REQUIRED", "Your session has expired — sign in again.", 401);
    }
    if (code === "auth/argument-error" || code === "auth/invalid-credential") {
      // Almost always a project-id mismatch: the token was issued by a
      // different Firebase project than the one FIREBASE_PROJECT_ID (the
      // Admin SDK credential) belongs to — i.e. NEXT_PUBLIC_FIREBASE_*
      // and FIREBASE_* point at two different Firebase projects.
      throw new AiApiError(
        "AUTH_REQUIRED",
        "Couldn't verify your sign-in — the app's client and server Firebase credentials look mismatched. Check that NEXT_PUBLIC_FIREBASE_PROJECT_ID and FIREBASE_PROJECT_ID in .env.local are the SAME Firebase project.",
        401
      );
    }
    throw new AiApiError("AUTH_REQUIRED", "Your session has expired — sign in again.", 401);
  }

  const uid = decoded.uid;
  const db = getAdminDb();
  const userRef = db.collection("users").doc(uid);
  const snap = await userRef.get();

  if (!snap.exists) {
    const freePlan = getDefaultPlan();
    const fresh: Omit<UserDoc, "createdAt" | "updatedAt"> = {
      uid,
      email: decoded.email ?? null,
      displayName: decoded.name ?? null,
      photoURL: decoded.picture ?? null,
      plan: freePlan.id,
      credits: freePlan.credits,
      lifetimeCreditsUsed: 0,
      monthlyCreditsUsed: 0,
      role: "user",
    };
    await userRef.set({
      ...fresh,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { uid, email: decoded.email ?? null, userDoc: { ...fresh, createdAt: null, updatedAt: null } };
  }

  return { uid, email: decoded.email ?? null, userDoc: snap.data() as UserDoc };
}

export function requireAdmin(authed: AuthedRequest) {
  if (authed.userDoc.role !== "admin") {
    throw new AiApiError("FORBIDDEN", "Admin access required.", 403);
  }
}
