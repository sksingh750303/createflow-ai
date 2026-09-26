"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { categories, tools } from "@/lib/tools";
import { ToolCard } from "@/components/tools/tool-card";
import { Button } from "@/components/ui/button";

export function AiToolsSection() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");

  const filtered = useMemo(() => {
    return tools
      .filter((t) => category === "All" || t.category === category)
      .filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 8);
  }, [query, category]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything you need to create with AI
        </h2>
        <p className="mt-3 text-muted-foreground">
          40+ purpose-built AI tools for writing, SEO, marketing, social, video and more.
        </p>
      </div>

      <div className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search AI tools…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {categories.map((c) => (
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

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((tool, i) => (
          <ToolCard tool={tool} key={tool.slug} index={i} />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
            No tools match &ldquo;{query}&rdquo;.
          </p>
        )}
      </div>

      <div className="mt-10 flex justify-center">
        <Link href="/tools">
          <Button variant="secondary" size="lg">
            View all AI tools
          </Button>
        </Link>
      </div>
    </section>
  );
}
