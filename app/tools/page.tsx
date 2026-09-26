import { Suspense } from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { ToolsLibraryClient } from "@/components/tools/tools-library-client";

export const metadata: Metadata = {
  title: "AI Tools",
  description: "Browse 40+ AI tools for writing, SEO, marketing, social, video and more.",
};

export default function ToolsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold tracking-tight">AI Tools Library</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Every AI tool on CreateFlow AI, in one searchable library.
        </p>
        <Suspense>
          <ToolsLibraryClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
