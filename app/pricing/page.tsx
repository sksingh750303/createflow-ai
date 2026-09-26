import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { PricingTable } from "@/components/pricing/pricing-table";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for CreateFlow AI — start free, upgrade anytime.",
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-3 text-muted-foreground">
            Start free. Upgrade anytime as your creative work grows. All demo plans — no real payment is ever processed.
          </p>
        </div>
        <div className="mt-12">
          <PricingTable />
        </div>
      </main>
      <Footer />
    </>
  );
}
