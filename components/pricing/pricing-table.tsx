"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Loader2, Sparkles } from "lucide-react";
import { plans } from "@/lib/billing/plans";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast-store";
import { useAuth } from "@/components/providers/auth-provider";
import { callApi, ApiClientError } from "@/lib/api-client";
import { PlanId } from "@/types";

export function PricingTable() {
  const router = useRouter();
  const [yearly, setYearly] = useState(false);
  const [redirectingPlan, setRedirectingPlan] = useState<PlanId | null>(null);
  const { firebaseUser } = useAuth();

  async function handleUpgrade(planId: PlanId) {
    if (!firebaseUser) {
      toast("Create a free account first to upgrade.", "default");
      router.push("/signup");
      return;
    }
    setRedirectingPlan(planId);
    try {
      const result = await callApi<{ url: string }>("/api/billing/checkout", {
        body: { planId, billingCycle: yearly ? "yearly" : "monthly" },
      });
      window.location.href = result.url;
    } catch (err) {
      if (err instanceof ApiClientError) toast(err.message, "error");
      else toast("Couldn't start checkout.", "error");
      setRedirectingPlan(null);
    }
  }

  return (
    <div>
      <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-border bg-surface p-1">
        <button
          onClick={() => setYearly(false)}
          className={`focus-ring rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            !yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setYearly(true)}
          className={`focus-ring flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          Yearly
          <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            Save 20%
          </span>
        </button>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            whileHover={{ y: -4 }}
            className={`relative flex flex-col rounded-2xl border p-6 ${
              plan.highlighted
                ? "border-primary bg-primary/[0.04] shadow-lg"
                : "border-border bg-surface"
            }`}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                <Sparkles className="h-3 w-3" /> Most popular
              </span>
            )}
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-semibold">
                ${yearly ? plan.yearlyPrice : plan.monthlyPrice}
              </span>
              <span className="text-sm text-muted-foreground">/mo</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {plan.credits.toLocaleString()} credits / month
            </p>
            <ul className="mt-5 flex-1 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className="mt-6 w-full"
              variant={plan.highlighted ? "primary" : "secondary"}
              disabled={redirectingPlan === plan.id}
              onClick={() =>
                plan.id === "free"
                  ? (firebaseUser ? router.push("/dashboard") : router.push("/signup"))
                  : handleUpgrade(plan.id)
              }
            >
              {redirectingPlan === plan.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : plan.id === "free" ? (
                firebaseUser ? "Current plan" : "Start Free"
              ) : (
                `Upgrade to ${plan.name}`
              )}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
