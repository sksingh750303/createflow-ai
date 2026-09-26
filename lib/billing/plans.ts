import { Plan, PlanId } from "@/types";

// Single source of truth for plan pricing, credits and features. Nothing
// in the UI or API routes should hardcode a plan's price/credits — import
// from here so pricing changes happen in exactly one place.
//
// `stripePriceId` fields are intentionally left blank — fill them in with
// the real Price IDs from your Stripe Dashboard (Product catalog → each
// plan → pricing). Monthly and yearly prices are usually separate Stripe
// Price objects even for the same Product.

export interface PlanConfig extends Plan {
  id: PlanId;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
}

export const plans: PlanConfig[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    credits: 100,
    features: [
      "100 credits / month",
      "Access to core AI tools",
      "3 saved projects",
      "Community support",
    ],
  },
  {
    id: "creator",
    name: "Creator",
    monthlyPrice: 19,
    yearlyPrice: 15,
    credits: 1000,
    features: [
      "1,000 credits / month",
      "All AI writing & image tools",
      "Unlimited projects",
      "Brand voice profile",
      "Email support",
    ],
    stripePriceIdMonthly: process.env.STRIPE_PRICE_CREATOR_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_PRICE_CREATOR_YEARLY,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 49,
    yearlyPrice: 39,
    credits: 5000,
    features: [
      "5,000 credits / month",
      "All tools incl. video generation",
      "Priority generation speed",
      "Full history & analytics",
      "Priority support",
    ],
    highlighted: true,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
  {
    id: "business",
    name: "Business",
    monthlyPrice: 129,
    yearlyPrice: 103,
    credits: 20000,
    features: [
      "20,000 credits / month",
      "Team seats & roles",
      "Advanced brand kit",
      "Dedicated integrations",
      "Priority + onboarding support",
    ],
    stripePriceIdMonthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY,
  },
];

export function getPlan(id: PlanId | string): PlanConfig {
  return plans.find((p) => p.id === id) ?? plans[0];
}

export function getDefaultPlan(): PlanConfig {
  return plans[0]; // "free"
}

export function getPlanByStripePriceId(priceId: string): PlanConfig | undefined {
  return plans.find(
    (p) => p.stripePriceIdMonthly === priceId || p.stripePriceIdYearly === priceId
  );
}

// Per-generation credit costs. Centralized here (not scattered across
// components) so the server and client always agree on cost — though the
// SERVER's copy of this file is what's actually charged; the client copy
// is only used to show the cost before generating.
export const CREDIT_COSTS = {
  textGeneration: 15,
  chatMessage: 2,
  imagePerImage: 10,
  videoGeneration: 50,
  socialPost: 5,
  seoAnalysis: 20,
} as const;
