import "server-only";

import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY (see .env.example).");
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2024-06-20",
    });
  }
  return stripeInstance;
}
