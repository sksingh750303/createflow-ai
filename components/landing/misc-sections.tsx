"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { templates } from "@/lib/templates";

export function TemplatesPreviewSection() {
  const preview = templates.slice(0, 8);
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Start faster with ready-made templates
        </h2>
        <p className="mt-3 text-muted-foreground">
          24+ templates across blog, social, email, YouTube and business content.
        </p>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {preview.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
          >
            <Link
              href={`/tools/${t.toolSlug}?template=${t.id}`}
              className="focus-ring group block overflow-hidden rounded-2xl border border-border bg-surface"
            >
              <div className={`flex h-24 items-center justify-center bg-gradient-to-br ${t.gradient}`}>
                <span className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                  {t.category}
                </span>
              </div>
              <div className="p-4">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <Link href="/templates">
          <Button variant="secondary" size="lg">
            Browse all templates
          </Button>
        </Link>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="animated-gradient-bg relative overflow-hidden rounded-3xl border border-border px-6 py-16 text-center sm:px-16">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Ready to create with AI?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          Join creators and teams already writing, designing and publishing
          faster with CreateFlow AI.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/signup">
            <Button size="lg">
              Start Creating Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="secondary">
              View pricing
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
