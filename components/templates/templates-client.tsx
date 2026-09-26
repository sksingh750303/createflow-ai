"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { templateCategories, templates } from "@/lib/templates";
import { Button } from "@/components/ui/button";

export function TemplatesClient() {
  const router = useRouter();
  const params = useSearchParams();
  const initialCategory =
    (params.get("category") as (typeof templateCategories)[number]) || "All";
  const [category, setCategory] = useState<(typeof templateCategories)[number]>(
    templateCategories.includes(initialCategory) ? initialCategory : "All"
  );

  const filtered = useMemo(
    () => templates.filter((t) => category === "All" || t.category === category),
    [category]
  );

  return (
    <div>
      <div className="mt-8 flex flex-wrap gap-2">
        {templateCategories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`focus-ring rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              category === c
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
            className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface"
          >
            <div className={`flex h-28 items-center justify-center bg-gradient-to-br ${t.gradient}`}>
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                {t.category}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="text-sm font-semibold">{t.name}</h3>
              <p className="mt-1 flex-1 text-xs text-muted-foreground">{t.description}</p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-4"
                onClick={() => router.push(`/tools/${t.toolSlug}?template=${t.id}`)}
              >
                Use Template
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
