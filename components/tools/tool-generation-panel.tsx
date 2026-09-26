"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, Download, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Tool } from "@/types";
import { Label, Input, Textarea, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { GENERATION_STAGES } from "@/lib/mock-ai";
import { useAuth } from "@/components/providers/auth-provider";
import { callApi, ApiClientError } from "@/lib/api-client";
import { toast } from "@/lib/toast-store";
import { templates } from "@/lib/templates";

export function ToolGenerationPanel({ tool }: { tool: Tool }) {
  const params = useSearchParams();
  const router = useRouter();
  const templateId = params.get("template");
  const template = templateId ? templates.find((t) => t.id === templateId) : null;

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    tool.fields.forEach((f) => {
      if (f.type === "select" && f.options) initial[f.name] = f.options[0];
    });
    if (template) initial.topic = template.name;
    return initial;
  });
  const [stage, setStage] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const { firebaseUser } = useAuth();

  function setValue(name: string, val: string) {
    setValues((v) => ({ ...v, [name]: val }));
    setError(null);
  }

  useEffect(() => () => {
    if (stageTimer.current) clearInterval(stageTimer.current);
  }, []);

  async function handleGenerate() {
    if (!values.topic || !values.topic.trim()) {
      setError("Enter a topic first.");
      return;
    }
    if (!firebaseUser) {
      toast("Sign in to generate — it's free to start.", "default");
      router.push("/signup");
      return;
    }

    setLoading(true);
    setResult(null);
    setStage(0);

    // Purely cosmetic step indicator that advances while the real request
    // is in flight — it does not fabricate a result; the actual content
    // only appears once the API call below resolves.
    const stages = GENERATION_STAGES.text;
    stageTimer.current = setInterval(() => {
      setStage((s) => Math.min(s + 1, stages.length - 1));
    }, 500);

    try {
      const res = await callApi<{ content: string }>("/api/ai/text", {
        body: {
          kind: "text",
          tool: tool.slug,
          topic: values.topic,
          tone: values.tone,
          language: values.language,
          length: values.length,
          keywords: values.keywords,
          instructions: values.instructions,
        },
      });
      setResult(res.content);
      toast("Generation completed", "success");
    } catch (err) {
      if (err instanceof ApiClientError) toast(err.message, "error");
      else toast("Something went wrong generating your content.", "error");
    } finally {
      if (stageTimer.current) clearInterval(stageTimer.current);
      setLoading(false);
      setStage(-1);
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result).catch(() => {});
    setCopied(true);
    toast("Copied to clipboard", "success");
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDownload() {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tool.slug}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Download started", "success");
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {tool.fields.map((field) => (
          <div key={field.name}>
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-rose-500"> *</span>}
            </Label>
            {field.type === "select" ? (
              <Select
                id={field.name}
                value={values[field.name] ?? field.options?.[0]}
                onChange={(e) => setValue(field.name, e.target.value)}
              >
                {field.options?.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            ) : field.type === "textarea" ? (
              <Textarea
                id={field.name}
                placeholder={field.placeholder}
                value={values[field.name] ?? ""}
                onChange={(e) => setValue(field.name, e.target.value)}
              />
            ) : (
              <Input
                id={field.name}
                placeholder={field.placeholder}
                value={values[field.name] ?? ""}
                onChange={(e) => setValue(field.name, e.target.value)}
              />
            )}
          </div>
        ))}
        {error && <p className="text-sm text-rose-500">{error}</p>}

        <Button className="w-full" size="lg" onClick={handleGenerate} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Generate ({tool.credits} credits)
            </>
          )}
        </Button>
        {!firebaseUser && (
          <p className="text-center text-xs text-muted-foreground">
            Sign in to generate — new accounts start with 100 free credits.
          </p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 space-y-2 rounded-xl border border-border bg-surface-2/60 p-4"
          >
            {GENERATION_STAGES.text.map((s, i) => (
              <div key={s} className="flex items-center gap-2 text-sm">
                {i < stage ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : i === stage ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                ) : (
                  <span className="h-3.5 w-3.5 rounded-full border border-border" />
                )}
                <span
                  className={i <= stage ? "text-foreground" : "text-muted-foreground"}
                >
                  {s}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {result && !loading && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-xl border border-border bg-surface-2/50 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Generated result
              </span>
              <div className="flex gap-1.5">
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDownload}>
                  <Download className="h-3.5 w-3.5" /> .txt
                </Button>
                <Button variant="ghost" size="sm" onClick={handleGenerate}>
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </Button>
              </div>
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {result}
            </p>
          </motion.div>
        )}

        {!result && !loading && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground"
          >
            Your generated content will appear here.
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
