import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { toErrorResponse, AiApiError } from "@/lib/ai/errors";
import { getStripe } from "@/lib/stripe";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

// One-time credit packs. Unlike subscription plans, these are cheap
// enough (and change rarely enough) that we build the Stripe Price
// inline with `price_data` rather than requiring a pre-created Price
// object per pack — swap this for fixed Price ids if you'd rather manage
// them in the Stripe Dashboard.
const CREDIT_PACKS: Record<string, { credits: number; usd: number }> = {
  small: { credits: 500, usd: 900 },
  medium: { credits: 2000, usd: 2900 },
  large: { credits: 5000, usd: 5900 },
};

const bodySchema = z.object({ packId: z.enum(["small", "medium", "large"]) });

export async function POST(req: NextRequest) {
  try {
    const authed = await requireAuth(req);
    await checkRateLimit({ uid: authed.uid, bucket: "billing-credits", limit: 10, windowSeconds: 60 });

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      throw new AiApiError("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid input.", 400);
    }
    const pack = CREDIT_PACKS[parsed.data.packId];

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
      mode: "payment",
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: pack.usd,
            product_data: { name: `${pack.credits.toLocaleString()} CreateFlow AI credits` },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard/billing?checkout=success`,
      cancel_url: `${appUrl}/dashboard/billing?checkout=cancelled`,
      metadata: { firebaseUid: authed.uid, credits: String(pack.credits), kind: "credit_pack" },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return toErrorResponse(err);
  }
}
