"use client";

import { useState } from "react";
import {
  Copy,
  Download,
  FileText,
  Languages,
  Loader2,
  Mail,
  Maximize2,
  Megaphone,
  Minimize2,
  Package,
  RefreshCw,
  Save,
  Sparkles,
  SpellCheck,
  Wand2,
} from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { useProjects } from "@/lib/hooks";
import { toast } from "@/lib/toast-store";
import { callApi, ApiClientError } from "@/lib/api-client";
import { wordCount } from "@/lib/utils";
import { CREDIT_COSTS } from "@/lib/billing/plans";

const contentTypes = [
  { label: "Blog", icon: FileText },
  { label: "Article", icon: FileText },
  { label: "Email", icon: Mail },
  { label: "Story", icon: Sparkles },
  { label: "Product Description", icon: Package },
  { label: "Ad Copy", icon: Megaphone },
  { label: "Social Post", icon: Megaphone },
];

const toolbarActions = [
  { label: "Rewrite", icon: RefreshCw },
  { label: "Expand", icon: Maximize2 },
  { label: "Shorten", icon: Minimize2 },
  { label: "Improve", icon: Sparkles },
  { label: "Fix Grammar", icon: SpellCheck },
  { label: "Change Tone", icon: Wand2 },
  { label: "Summarize", icon: Minimize2 },
  { label: "Translate", icon: Languages },
];

export default function WriterPage() {
  const [activeType, setActiveType] = useState("Blog");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const { createProject } = useProjects();

  async function handleGenerateDraft() {
    if (!title.trim()) {
      toast("Enter a topic or title first.", "error");
      return;
    }
    setGenerating(true);
    try {
      const result = await callApi<{ content: string }>("/api/ai/text", {
        body: { kind: "text", tool: activeType.toLowerCase().replace(/\s+/g, "-"), topic: title },
      });
      setContent(result.content);
      toast("Generation completed", "success");
    } catch (err) {
      if (err instanceof ApiClientError) toast(err.message, "error");
      else toast("Something went wrong generating your draft.", "error");
    } finally {
      setGenerating(false);
    }
  }

  async function handleToolbarAction(action: string) {
    if (!content.trim()) {
      toast("Write or generate content first.", "error");
      return;
    }
    setBusyAction(action);
    try {
      // Each editor action is itself a fresh (billed) text generation —
      // we send the current content back as context via `instructions` so
      // the model edits it rather than starting from scratch.
      const result = await callApi<{ content: string }>("/api/ai/text", {
        body: {
          kind: "text",
          tool: `writer-${action.toLowerCase().replace(/\s+/g, "-")}`,
          topic: title || "this content",
          instructions: `${action} the following content and return only the revised version:\n\n${content}`,
        },
      });
      setContent(result.content);
      toast(`${action} applied`, "success");
    } catch (err) {
      if (err instanceof ApiClientError) toast(err.message, "error");
      else toast("Something went wrong.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      toast("Add a title before saving.", "error");
      return;
    }
    try {
      await createProject({ name: title, type: "Writing", status: "draft", content });
      toast("Project saved", "success");
    } catch {
      toast("Couldn't save — please sign in again.", "error");
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(content).catch(() => {});
    toast("Copied to clipboard", "success");
  }

  function handleExport() {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "untitled"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Export started", "success");
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <Card className="h-fit p-3">
        <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Content type
        </p>
        <div className="mt-1 space-y-1">
          {contentTypes.map((type) => (
            <button
              key={type.label}
              onClick={() => setActiveType(type.label)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                activeType === type.label
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <type.icon className="h-4 w-4" />
              {type.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <Input
            placeholder="Untitled — enter a title or topic"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-auto border-0 bg-transparent px-0 text-xl font-semibold focus-visible:ring-0"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <Button size="sm" onClick={handleGenerateDraft} disabled={generating}>
              {generating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Generate draft ({CREDIT_COSTS.textGeneration} credits)
            </Button>
            {toolbarActions.map((action) => (
              <Button
                key={action.label}
                size="sm"
                variant="secondary"
                onClick={() => handleToolbarAction(action.label)}
                disabled={busyAction !== null}
              >
                {busyAction === action.label ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <action.icon className="h-3.5 w-3.5" />
                )}
                {action.label}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Your generated content will appear here — or start writing and use the AI toolbar above to refine it."
            className="focus-ring min-h-[360px] w-full resize-y bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
          />
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">{wordCount(content)} words</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={handleCopy}>
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
              <Button size="sm" variant="ghost" onClick={handleExport}>
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="h-3.5 w-3.5" /> Save
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
