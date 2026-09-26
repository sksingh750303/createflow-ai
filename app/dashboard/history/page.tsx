"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  FileText,
  Image as ImageIcon,
  Megaphone,
  Search,
  Trash2,
  TrendingUp,
  Video,
} from "lucide-react";
import { Card, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useHistory } from "@/lib/hooks";
import { relativeTime } from "@/lib/utils";
import { toast } from "@/lib/toast-store";
import { Generation, GenerationType } from "@/types";

const tabs: (GenerationType | "All")[] = ["All", "Writing", "Images", "Video", "Social", "SEO"];

const typeIcons: Record<GenerationType, typeof FileText> = {
  Writing: FileText,
  Images: ImageIcon,
  Video: Video,
  Social: Megaphone,
  SEO: TrendingUp,
};

export default function HistoryPage() {
  const { history, deleteGeneration } = useHistory();
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState<Generation | null>(null);

  const filtered = useMemo(
    () =>
      history
        .filter((h) => tab === "All" || h.type === tab)
        .filter((h) => h.title.toLowerCase().includes(query.toLowerCase())),
    [history, tab, query]
  );

  function handleCopy(g: Generation) {
    navigator.clipboard.writeText(g.content).catch(() => {});
    toast("Copied to clipboard", "success");
  }

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="text-2xl font-semibold tracking-tight">History</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every generation you&apos;ve made.</p>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`focus-ring rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                tab === t
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex w-full max-w-xs items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 sm:w-64">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search history…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="mt-8 flex flex-col items-center justify-center p-16 text-center">
          <p className="text-sm text-muted-foreground">No generation history yet.</p>
        </Card>
      ) : (
        <Card className="mt-6 divide-y divide-border">
          {filtered.map((g) => {
            const Icon = typeIcons[g.type];
            return (
              <div key={g.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <button
                  onClick={() => setViewing(g)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm font-medium">{g.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{g.prompt}</p>
                </button>
                <Badge
                  variant={
                    g.status === "completed"
                      ? "success"
                      : g.status === "failed" || g.status === "cancelled"
                      ? "danger"
                      : "accent"
                  }
                  className="hidden sm:inline-flex"
                >
                  {g.status}
                </Badge>
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                  {relativeTime(g.createdAt)}
                </span>
                <span className="hidden shrink-0 text-xs text-muted-foreground md:block">
                  {g.creditsUsed} credits
                </span>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => handleCopy(g)}
                    className="focus-ring rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                    aria-label="Copy"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={async () => {
                      await deleteGeneration(g.id);
                      toast("Deleted from history", "success");
                    }}
                    className="focus-ring rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.title}>
        <p className="whitespace-pre-line text-sm text-foreground/90">{viewing?.content}</p>
        <Button className="mt-4 w-full" variant="secondary" onClick={() => viewing && handleCopy(viewing)}>
          <Copy className="h-3.5 w-3.5" /> Copy content
        </Button>
      </Modal>
    </div>
  );
}
