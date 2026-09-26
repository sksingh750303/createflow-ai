"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CreditCard,
  FileText,
  Image as ImageIcon,
  LayoutTemplate,
  Search,
  Settings,
  Sparkles,
  Video,
} from "lucide-react";
import { tools } from "@/lib/tools";
import { templates } from "@/lib/templates";

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  action: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const staticCommands: Command[] = useMemo(
    () => [
      { id: "cmd-writer", label: "Open AI Writer", icon: <FileText className="h-4 w-4" />, action: () => router.push("/dashboard/writer") },
      { id: "cmd-image", label: "Generate image", icon: <ImageIcon className="h-4 w-4" />, action: () => router.push("/dashboard/image") },
      { id: "cmd-video", label: "Generate video", icon: <Video className="h-4 w-4" />, action: () => router.push("/dashboard/video") },
      { id: "cmd-project", label: "Create project", icon: <Sparkles className="h-4 w-4" />, action: () => router.push("/dashboard/projects") },
      { id: "cmd-templates", label: "Browse templates", icon: <LayoutTemplate className="h-4 w-4" />, action: () => router.push("/templates") },
      { id: "cmd-settings", label: "Open settings", icon: <Settings className="h-4 w-4" />, action: () => router.push("/dashboard/settings") },
      { id: "cmd-pricing", label: "Open pricing", icon: <CreditCard className="h-4 w-4" />, action: () => router.push("/pricing") },
    ],
    [router]
  );

  const toolCommands: Command[] = useMemo(
    () =>
      tools.slice(0, 12).map((t) => ({
        id: `tool-${t.slug}`,
        label: t.name,
        hint: t.category,
        icon: <Sparkles className="h-4 w-4" />,
        action: () => router.push(`/tools/${t.slug}`),
      })),
    [router]
  );

  const allCommands = [...staticCommands, ...toolCommands];

  const filtered = query
    ? allCommands.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase())
      )
    : allCommands;

  function runCommand(cmd: Command) {
    cmd.action();
    setOpen(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
            role="dialog"
            aria-label="Command palette"
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiveIndex((i) => Math.max(i - 1, 0));
                  } else if (e.key === "Enter" && filtered[activeIndex]) {
                    runCommand(filtered[activeIndex]);
                  }
                }}
                placeholder="Search tools, templates, actions…"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                ESC
              </kbd>
            </div>
            <div className="max-h-80 overflow-y-auto scrollbar-thin p-2">
              {filtered.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No results found.
                </p>
              )}
              {filtered.map((cmd, i) => (
                <button
                  key={cmd.id}
                  onClick={() => runCommand(cmd)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    i === activeIndex
                      ? "bg-primary/10 text-foreground"
                      : "text-foreground/90 hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-accent">{cmd.icon}</span>
                    {cmd.label}
                  </span>
                  {cmd.hint && (
                    <span className="text-xs text-muted-foreground">{cmd.hint}</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
