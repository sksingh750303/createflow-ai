import { Suspense } from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { TemplatesClient } from "@/components/templates/templates-client";

export const metadata: Metadata = {
  title: "Templates",
  description: "24+ ready-made templates for blog, social, email, YouTube and business content.",
};

export default function TemplatesPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold tracking-tight">Templates</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Prefilled workflows to get you started faster.
        </p>
        <Suspense>
          <TemplatesClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
