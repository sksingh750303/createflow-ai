import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { toErrorResponse, AiApiError } from "@/lib/ai/errors";
import { getStripe } from "@/lib/stripe";
import { getPlan } from "@/lib/billing/plans";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const bodySchema = z.object({
  planId: z.enum(["creator", "pro", "business"]),
  billingCycle: z.enum(["monthly", "yearly"]),
});

export async function POST(req: NextRequest) {
  try {
    const authed = await requireAuth(req);
    await checkRateLimit({ uid: authed.uid, bucket: "billing-checkout", limit: 10, windowSeconds: 60 });

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      throw new AiApiError("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid input.", 400);
    }

    const plan = getPlan(parsed.data.planId);
    const priceId =
      parsed.data.billingCycle === "yearly" ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;

    if (!priceId) {
      throw new AiApiError(
        "PAYMENT_FAILED",
        `No Stripe price configured for the ${plan.name} plan (${parsed.data.billingCycle}). ` +
          "Add the price id in lib/billing/plans.ts / your env vars.",
        500
      );
    }

    const stripe = getStripe();
    const db = getAdminDb();
    const userRef = db.collection("users").doc(authed.uid);
    let customerId = authed.userDoc.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: authed.email ?? undefined,
        metadata: { firebaseUid: authed.uid },
      });
      customerId = customer.id;
      await userRef.update({ stripeCustomerId: customerId });
    }

    const appUrl = process.env.APP_URL || req.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/billing?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
      metadata: { firebaseUid: authed.uid, planId: plan.id },
      subscription_data: {
        metadata: { firebaseUid: authed.uid, planId: plan.id },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return toErrorResponse(err);
  }
}
