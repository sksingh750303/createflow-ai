import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getAdminDb } from "@/lib/firebase/admin";
import { getPlan, getPlanByStripePriceId } from "@/lib/billing/plans";
import { grantCredits } from "@/lib/credits";

export const runtime = "nodejs";

// Stripe requires the RAW request body to verify the webhook signature —
// Next.js route handlers give you the raw body via req.text() as long as
// you don't call req.json() first, so no special config is needed here
// (unlike the old pages/api bodyParser: false requirement).

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    // eslint-disable-next-line no-console
    console.error("[webhooks/stripe] missing signature or STRIPE_WEBHOOK_SECRET — rejecting.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const rawBody = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[webhooks/stripe] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const db = getAdminDb();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.metadata?.firebaseUid;

      // One-time credit pack purchase.
      if (uid && session.metadata?.kind === "credit_pack") {
        const credits = Number(session.metadata.credits || 0);
        if (credits > 0) {
          await grantCredits({
            uid,
            amount: credits,
            type: "purchase",
            description: `Credit pack purchase (${credits.toLocaleString()} credits)`,
            idempotencyKey: `stripe_${event.id}`,
          });
        }
        break;
      }

      // Subscription plan upgrade.
      const planId = session.metadata?.planId;
      if (uid && planId) {
        const plan = getPlan(planId);
        await db.collection("users").doc(uid).update({
          plan: plan.id,
          stripeSubscriptionId: (session.subscription as string) ?? null,
          updatedAt: FieldValue.serverTimestamp(),
        });
        await grantCredits({
          uid,
          amount: plan.credits,
          type: "plan_grant",
          description: `Plan upgrade to ${plan.name}`,
          idempotencyKey: `stripe_${event.id}`,
        });
      }
      break;
    }

    case "invoice.paid": {
      // Recurring renewal — top up the monthly credit allotment.
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string | null;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const uid = subscription.metadata?.firebaseUid;
        const priceId = subscription.items.data[0]?.price.id;
        if (uid && priceId) {
          const plan = getPlanByStripePriceId(priceId);
          if (plan) {
            await grantCredits({
              uid,
              amount: plan.credits,
              type: "plan_grant",
              description: `Monthly renewal — ${plan.name}`,
              idempotencyKey: `stripe_${event.id}`,
            });
          }
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const uid = subscription.metadata?.firebaseUid;
      if (uid) {
        await db.collection("users").doc(uid).update({
          plan: "free",
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      break;
    }

    default:
      break; // Ignore event types we don't act on.
  }

  return NextResponse.json({ received: true });
}
