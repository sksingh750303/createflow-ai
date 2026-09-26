"use client";

import { useState } from "react";
import { CreditCard, Zap } from "lucide-react";
import { Card, Progress } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/components/providers/auth-provider";
import { getPlan, plans } from "@/lib/billing/plans";
import { callApi, ApiClientError } from "@/lib/api-client";
import { toast } from "@/lib/toast-store";

const creditPacks: { id: "small" | "medium" | "large"; amount: number; price: number }[] = [
  { id: "small", amount: 500, price: 9 },
  { id: "medium", amount: 2000, price: 29 },
  { id: "large", amount: 5000, price: 59 },
];

export default function BillingPage() {
  const { userDoc } = useAuth();
  const [manageOpen, setManageOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const currentPlan = getPlan(userDoc?.plan ?? "free");
  const used = Math.max(0, currentPlan.credits - (userDoc?.credits ?? 0));
  const usagePct = Math.min(100, Math.max(0, (used / currentPlan.credits) * 100));

  async function handleUpgrade(planId: string) {
    setRedirecting(true);
    try {
      const result = await callApi<{ url: string }>("/api/billing/checkout", {
        body: { planId, billingCycle: "monthly" },
      });
      window.location.href = result.url;
    } catch (err) {
      if (err instanceof ApiClientError) toast(err.message, "error");
      else toast("Couldn't start checkout.", "error");
      setRedirecting(false);
    }
  }

  async function handleBuyCredits(packId: "small" | "medium" | "large") {
    setRedirecting(true);
    try {
      const result = await callApi<{ url: string }>("/api/billing/credits", { body: { packId } });
      window.location.href = result.url;
    } catch (err) {
      if (err instanceof ApiClientError) toast(err.message, "error");
      else toast("Couldn't start checkout.", "error");
      setRedirecting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>

      <Card className="p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-muted-foreground">Current plan</p>
            <p className="mt-1 text-2xl font-semibold capitalize">{userDoc?.plan ?? "free"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setManageOpen(true)}>
              Manage Plan
            </Button>
            <Button onClick={() => setBuyOpen(true)}>
              <Zap className="h-4 w-4" /> Buy Credits
            </Button>
          </div>
        </div>
        <div className="mt-6">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Credits used this cycle</span>
            <span className="font-medium">
              {used.toLocaleString()} / {currentPlan.credits.toLocaleString()}
            </span>
          </div>
          <Progress value={usagePct} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Credits remaining</p>
            <p className="font-medium">{userDoc?.credits?.toLocaleString() ?? 0}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-sm font-semibold">Payment method</h2>
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 p-4">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Managed by Stripe Checkout</p>
              <p className="text-xs text-muted-foreground">
                Your card is stored securely by Stripe — CreateFlow AI never sees it.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              toast("Full billing-portal link coming soon — use Manage Plan to change plans for now.")
            }
          >
            Manage
          </Button>
        </div>
      </Card>

      <Modal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        title="Manage plan"
        description="You'll be redirected to a secure Stripe Checkout page."
      >
        <div className="space-y-2">
          {plans
            .filter((p) => p.id !== "free")
            .map((p) => (
              <button
                key={p.id}
                onClick={() => handleUpgrade(p.id)}
                disabled={redirecting}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm ${
                  p.id === userDoc?.plan ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                }`}
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground">${p.monthlyPrice}/mo</span>
              </button>
            ))}
        </div>
      </Modal>

      <Modal
        open={buyOpen}
        onClose={() => setBuyOpen(false)}
        title="Buy credits"
        description="One-time credit pack — redirects to Stripe Checkout."
      >
        <div className="space-y-2">
          {creditPacks.map((pack) => (
            <button
              key={pack.id}
              onClick={() => handleBuyCredits(pack.id)}
              disabled={redirecting}
              className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-left text-sm hover:bg-muted"
            >
              <span className="font-medium">{pack.amount.toLocaleString()} credits</span>
              <span className="text-muted-foreground">${pack.price}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
