"use client";

import { useState } from "react";
import * as Icons from "lucide-react";
import { Loader2, Sparkles } from "lucide-react";
import { Card, Progress } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { toast } from "@/lib/toast-store";
import { callApi, ApiClientError } from "@/lib/api-client";
import { CREDIT_COSTS } from "@/lib/billing/plans";

const seoTools = [
  { label: "SEO Article", icon: "FileText" },
  { label: "Keyword Cluster", icon: "Layers" },
  { label: "Search Intent", icon: "Search" },
  { label: "Meta Title", icon: "Heading" },
  { label: "Meta Description", icon: "AlignLeft" },
  { label: "FAQ Generator", icon: "HelpCircle" },
  { label: "Content Brief", icon: "ClipboardList" },
  { label: "Internal Links", icon: "Link2" },
  { label: "Schema Generator", icon: "Braces" },
];

interface SeoResult {
  content: string;
  seo: {
    score: number;
    readability: number;
    keywordUsage: number;
    headingStructure: number;
    metaData: number;
    contentLength: number;
  } | null;
}

export default function SeoPage() {
  const [activeTool, setActiveTool] = useState(seoTools[0].label);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SeoResult | null>(null);

  async function handleAnalyze() {
    if (!keyword.trim()) {
      toast("Enter a keyword or topic first.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await callApi<SeoResult>("/api/ai/text", {
        body: {
          kind: "seo",
          tool: activeTool.toLowerCase().replace(/\s+/g, "-"),
          topic: keyword,
          keywords: keyword,
        },
      });
      setResult(res);
      toast("Generation completed", "success");
    } catch (err) {
      if (err instanceof ApiClientError) toast(err.message, "error");
      else toast("Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  }

  const metrics = result?.seo
    ? [
        { label: "SEO Score", value: result.seo.score },
        { label: "Readability", value: result.seo.readability },
        { label: "Keyword Usage", value: result.seo.keywordUsage },
        { label: "Heading Structure", value: result.seo.headingStructure },
        { label: "Meta Data", value: result.seo.metaData },
        { label: "Content Length", value: result.seo.contentLength },
      ]
    : [];

  return (
    <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Card className="h-fit p-3">
        <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          SEO tools
        </p>
        <div className="mt-1 space-y-1">
          {seoTools.map((tool) => {
            const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[tool.icon] ?? Icons.Sparkles;
            return (
              <button
                key={tool.label}
                onClick={() => setActiveTool(tool.label)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                  activeTool === tool.label
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tool.label}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-5">
          <h1 className="text-lg font-semibold">{activeTool}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter a keyword or topic to run this SEO tool.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Label htmlFor="keyword">Keyword / topic</Label>
              <Input
                id="keyword"
                placeholder="e.g. best ai writing tools"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <Button className="self-end" onClick={handleAnalyze} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Analyze ({CREDIT_COSTS.seoAnalysis} credits)
            </Button>
          </div>
        </Card>

        {result && (
          <>
            {result.seo && (
              <Card className="p-5">
                <h2 className="mb-4 text-sm font-semibold">SEO analysis</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {metrics.map((m) => (
                    <div key={m.label}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{m.label}</span>
                        <span className="font-medium">{m.value}/100</span>
                      </div>
                      <Progress value={m.value} />
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Scores are computed from the generated content itself (keyword density, sentence
                  length, structure) — swap in a dedicated SEO API for deeper analysis.
                </p>
              </Card>
            )}

            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold">Generated content</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                {result.content}
              </p>
            </Card>
          </>
        )}

        {!result && (
          <Card className="flex min-h-[200px] flex-col items-center justify-center p-8 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              Run an analysis to see your SEO score and generated content.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
