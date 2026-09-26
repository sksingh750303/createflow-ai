"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { categories, tools } from "@/lib/tools";
import { ToolCard } from "@/components/tools/tool-card";

export function ToolsLibraryClient() {
  const params = useSearchParams();
  const initialCategory = (params.get("category") as (typeof categories)[number]) || "All";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>(
    categories.includes(initialCategory) ? initialCategory : "All"
  );

  const filtered = useMemo(() => {
    return tools
      .filter((t) => category === "All" || t.category === category)
      .filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));
  }, [query, category]);

  return (
    <div>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search AI tools…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <p className="text-sm text-muted-foreground">{filtered.length} tools</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
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

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((tool, i) => (
          <ToolCard tool={tool} key={tool.slug} index={i} />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-16 text-center text-sm text-muted-foreground">
            No tools match your search.
          </p>
        )}
      </div>
    </div>
  );
}
