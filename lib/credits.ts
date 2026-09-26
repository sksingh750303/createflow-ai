import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { AiApiError } from "@/lib/ai/errors";

/**
 * Atomically checks and deducts credits for a generation, inside a single
 * Firestore transaction, so two concurrent/retried requests can never
 * double-charge the same user. Idempotency is enforced via `generationId`:
 * if a creditTransactions/{generationId}_debit document already exists,
 * this is a no-op (the charge already happened).
 *
 * Throws AiApiError("INSUFFICIENT_CREDITS") if the user can't afford it —
 * callers should catch this BEFORE calling the AI provider.
 */
export async function chargeCredits(params: {
  uid: string;
  amount: number;
  generationId: string;
  description: string;
}): Promise<{ balanceAfter: number }> {
  const { uid, amount, generationId, description } = params;
  const db = getAdminDb();
  const userRef = db.collection("users").doc(uid);
  // Deterministic transaction id → retries of the same generation are safe.
  const txnRef = db.collection("creditTransactions").doc(`${generationId}_debit`);

  return db.runTransaction(async (tx) => {
    const [userSnap, txnSnap] = await Promise.all([tx.get(userRef), tx.get(txnRef)]);

    if (txnSnap.exists) {
      // Already charged for this generation — idempotent no-op.
      const existing = txnSnap.data();
      return { balanceAfter: existing?.balanceAfter ?? 0 };
    }

    if (!userSnap.exists) {
      throw new AiApiError("AUTH_REQUIRED", "User record not found.", 401);
    }

    const balanceBefore: number = userSnap.data()?.credits ?? 0;
    if (balanceBefore < amount) {
      throw new AiApiError(
        "INSUFFICIENT_CREDITS",
        `This generation needs ${amount} credits — you have ${balanceBefore}. Upgrade your plan or buy more credits.`,
        402
      );
    }

    const balanceAfter = balanceBefore - amount;

    tx.update(userRef, {
      credits: balanceAfter,
      lifetimeCreditsUsed: FieldValue.increment(amount),
      monthlyCreditsUsed: FieldValue.increment(amount),
      updatedAt: FieldValue.serverTimestamp(),
    });

    tx.set(txnRef, {
      userId: uid,
      generationId,
      type: "debit",
      amount,
      balanceBefore,
      balanceAfter,
      description,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { balanceAfter };
  });
}

/**
 * Refunds credits for a generation that failed AFTER being charged (e.g. a
 * video provider job that errors out asynchronously, post-webhook). Also
 * idempotent — refunding the same generation twice is a no-op.
 */
export async function refundCredits(params: {
  uid: string;
  amount: number;
  generationId: string;
  description: string;
}): Promise<{ balanceAfter: number } | null> {
  const { uid, amount, generationId, description } = params;
  const db = getAdminDb();
  const userRef = db.collection("users").doc(uid);
  const debitRef = db.collection("creditTransactions").doc(`${generationId}_debit`);
  const refundRef = db.collection("creditTransactions").doc(`${generationId}_refund`);

  return db.runTransaction(async (tx) => {
    const [userSnap, debitSnap, refundSnap] = await Promise.all([
      tx.get(userRef),
      tx.get(debitRef),
      tx.get(refundRef),
    ]);

    // Nothing was ever charged, or it was already refunded — no-op.
    if (!debitSnap.exists || refundSnap.exists || !userSnap.exists) return null;

    const balanceBefore: number = userSnap.data()?.credits ?? 0;
    const balanceAfter = balanceBefore + amount;

    tx.update(userRef, {
      credits: balanceAfter,
      lifetimeCreditsUsed: FieldValue.increment(-amount),
      monthlyCreditsUsed: FieldValue.increment(-amount),
      updatedAt: FieldValue.serverTimestamp(),
    });

    tx.set(refundRef, {
      userId: uid,
      generationId,
      type: "refund",
      amount,
      balanceBefore,
      balanceAfter,
      description,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { balanceAfter };
  });
}

/** Grants credits from a plan change or a purchased pack (billing flows). */
export async function grantCredits(params: {
  uid: string;
  amount: number;
  type: "purchase" | "plan_grant";
  description: string;
  idempotencyKey: string; // e.g. a Stripe event id, so webhook retries don't double-grant
}): Promise<{ balanceAfter: number }> {
  const { uid, amount, type, description, idempotencyKey } = params;
  const db = getAdminDb();
  const userRef = db.collection("users").doc(uid);
  const txnRef = db.collection("creditTransactions").doc(idempotencyKey);

  return db.runTransaction(async (tx) => {
    const [userSnap, txnSnap] = await Promise.all([tx.get(userRef), tx.get(txnRef)]);
    if (txnSnap.exists) {
      const existing = txnSnap.data();
      return { balanceAfter: existing?.balanceAfter ?? 0 };
    }
    if (!userSnap.exists) {
      throw new AiApiError("AUTH_REQUIRED", "User record not found.", 401);
    }

    const balanceBefore: number = userSnap.data()?.credits ?? 0;
    const balanceAfter = balanceBefore + amount;

    tx.update(userRef, { credits: balanceAfter, updatedAt: FieldValue.serverTimestamp() });
    tx.set(txnRef, {
      userId: uid,
      generationId: null,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      description,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { balanceAfter };
  });
}
