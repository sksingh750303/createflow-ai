"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Facebook,
  Instagram,
  Linkedin,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  Twitter,
  Youtube,
} from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form";
import { toast } from "@/lib/toast-store";
import { callApi, ApiClientError } from "@/lib/api-client";
import { CREDIT_COSTS } from "@/lib/billing/plans";
import { useProjects } from "@/lib/hooks";

const platforms = [
  { name: "Instagram", icon: Instagram },
  { name: "Facebook", icon: Facebook },
  { name: "LinkedIn", icon: Linkedin },
  { name: "X", icon: Twitter },
  { name: "YouTube", icon: Youtube },
];

const objectives = ["Awareness", "Engagement", "Sales"];
const tones = ["Professional", "Friendly", "Bold", "Playful"];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const calendarSeed: Record<string, { platform: string; title: string }[]> = {
  Monday: [{ platform: "LinkedIn", title: "Thought leadership post" }],
  Tuesday: [{ platform: "Instagram", title: "Product teaser reel" }],
  Wednesday: [],
  Thursday: [{ platform: "X", title: "Customer story thread" }],
  Friday: [{ platform: "Instagram", title: "Weekly recap carousel" }, { platform: "Facebook", title: "Promo post" }],
  Saturday: [],
  Sunday: [{ platform: "YouTube", title: "Short-form teaser" }],
};

interface SocialPost {
  hook: string;
  caption: string;
  cta: string;
  hashtags: string[];
}

export default function SocialPage() {
  const [platform, setPlatform] = useState(platforms[0].name);
  const [brand, setBrand] = useState("");
  const [audience, setAudience] = useState("");
  const [objective, setObjective] = useState(objectives[0]);
  const [tone, setTone] = useState(tones[0]);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState<SocialPost | null>(null);
  const [calendar] = useState(calendarSeed);
  const { createProject } = useProjects();

  async function handleGenerate() {
    if (!topic.trim()) {
      toast("Enter a topic first.", "error");
      return;
    }
    setLoading(true);
    try {
      const result = await callApi<{ post: SocialPost }>("/api/ai/social", {
        body: { platform, brand, audience, objective, tone, topic },
      });
      setPost(result.post);
      toast("Generation completed", "success");
    } catch (err) {
      if (err instanceof ApiClientError) toast(err.message, "error");
      else toast("Something went wrong generating the post.", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!post) return;
    navigator.clipboard
      .writeText(`${post.hook}\n\n${post.caption}\n\n${post.cta}\n\n${post.hashtags.join(" ")}`)
      .catch(() => {});
    toast("Copied to clipboard", "success");
  }

  async function handleSave() {
    if (!post) return;
    await createProject({ name: `${platform} post – ${topic}`, type: "Social", status: "draft", content: post.caption });
    toast("Saved to projects", "success");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="h-fit space-y-4 p-5">
          <div>
            <Label>Platform</Label>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setPlatform(p.name)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                    platform === p.name
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <p.icon className="h-3.5 w-3.5" />
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="brand">Brand / product</Label>
            <Input id="brand" placeholder="e.g. Northwind Coffee" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="audience">Audience</Label>
            <Input id="audience" placeholder="e.g. Coffee lovers 25-40" value={audience} onChange={(e) => setAudience(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="objective">Objective</Label>
              <Select id="objective" value={objective} onChange={(e) => setObjective(e.target.value)}>
                {objectives.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="tone">Tone</Label>
              <Select id="tone" value={tone} onChange={(e) => setTone(e.target.value)}>
                {tones.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="topic">Topic</Label>
            <Input id="topic" placeholder="e.g. New autumn collection launch" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <Button className="w-full" size="lg" onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate ({CREDIT_COSTS.socialPost} credits)
          </Button>
        </Card>

        <Card className="p-5">
          <AnimatePresence mode="wait">
            {post ? (
              <motion.div key="post" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hook</p>
                  <p className="mt-1 text-sm font-medium">{post.hook}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Caption</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-foreground/90">{post.caption}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">CTA</p>
                  <p className="mt-1 text-sm">{post.cta}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {post.hashtags.map((h) => (
                    <span key={h} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                      {h}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 border-t border-border pt-4">
                  <Button size="sm" variant="ghost" onClick={handleCopy}>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleGenerate}>
                    <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleSave}>
                    <Save className="h-3.5 w-3.5" /> Save
                  </Button>
                  <Button size="sm" onClick={() => toast("Scheduling integration coming soon")}>
                    Schedule
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex min-h-[300px] flex-col items-center justify-center text-center"
              >
                <Sparkles className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Your generated post will appear here.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold">Content calendar</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {days.map((day) => (
            <div key={day} className="rounded-xl border border-border bg-surface-2/40 p-3">
              <p className="text-xs font-semibold text-muted-foreground">{day}</p>
              <div className="mt-2 space-y-2">
                {calendar[day].map((item, i) => (
                  <div
                    key={i}
                    className="cursor-grab rounded-lg border border-border bg-surface px-2.5 py-2 text-xs active:cursor-grabbing"
                  >
                    <p className="font-medium">{item.platform}</p>
                    <p className="text-muted-foreground">{item.title}</p>
                  </div>
                ))}
                {calendar[day].length === 0 && (
                  <p className="text-[11px] text-muted-foreground">No posts scheduled</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
