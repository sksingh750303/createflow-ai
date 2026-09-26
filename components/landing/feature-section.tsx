"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeatureSection({
  eyebrow,
  title,
  description,
  bullets,
  cta,
  href,
  icon,
  reverse,
  accent,
}: {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  cta: string;
  href: string;
  /** Name of a lucide-react icon, e.g. "PenLine". Passed as a string (not a
   * component reference) so this data can safely cross the Server → Client
   * Component boundary when used from a Server Component. */
  icon: string;
  reverse?: boolean;
  accent: string;
}) {
  const Icon =
    (Icons as unknown as Record<string, Icons.LucideIcon>)[icon] ?? Icons.Sparkles;

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div
        className={`grid items-center gap-10 lg:grid-cols-2 ${
          reverse ? "lg:[&>*:first-child]:order-2" : ""
        }`}
      >
        <motion.div
          initial={{ opacity: 0, x: reverse ? 24 : -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            {eyebrow}
          </span>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h3>
          <p className="mt-3 text-muted-foreground">{description}</p>
          <ul className="mt-5 space-y-2.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm text-foreground/90">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {b}
              </li>
            ))}
          </ul>
          <Link href={href}>
            <Button variant="secondary" className="mt-6">
              {cta}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className={`flex aspect-[4/3] items-center justify-center rounded-3xl border border-border bg-gradient-to-br ${accent} p-8`}
        >
          <Icon className="h-24 w-24 text-foreground/70" strokeWidth={1.2} />
        </motion.div>
      </div>
    </section>
  );
}
