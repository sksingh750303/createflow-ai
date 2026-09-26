"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  ImagePlus,
  Loader2,
  Pencil,
  Shuffle,
  Sparkles,
  Trash2,
  Upload,
  ZoomIn,
} from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/form";
import { toast } from "@/lib/toast-store";
import { callApi, ApiClientError } from "@/lib/api-client";
import { CREDIT_COSTS } from "@/lib/billing/plans";

const styles = ["Realistic", "3D", "Anime", "Illustration", "Cinematic", "Minimal", "Product Photography"];
const ratios = ["1:1", "16:9", "9:16", "4:3"];
const qualities = ["Standard", "HD"];
const counts = [1, 2, 4];

export default function ImagePage() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState(styles[0]);
  const [ratio, setRatio] = useState(ratios[0]);
  const [quality, setQuality] = useState(qualities[0]);
  const [count, setCount] = useState(4);
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const creditCost = CREDIT_COSTS.imagePerImage * count;

  async function handleGenerate() {
    if (!prompt.trim()) {
      toast("Describe the image you want first.", "error");
      return;
    }
    setLoading(true);
    setImageUrls([]);
    try {
      const result = await callApi<{ imageUrls: string[] }>("/api/ai/image", {
        body: { prompt, style, aspectRatio: ratio, quality, count },
      });
      setImageUrls(result.imageUrls);
      toast("Generation completed", "success");
    } catch (err) {
      if (err instanceof ApiClientError) toast(err.message, "error");
      else toast("Something went wrong generating images.", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(url: string) {
    setImageUrls((imgs) => imgs.filter((i) => i !== url));
    toast("Image removed from view");
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      <Card className="h-fit space-y-4 p-5">
        <div>
          <Label htmlFor="prompt">Prompt</Label>
          <Textarea
            id="prompt"
            placeholder="e.g. A minimalist ceramic coffee dripper on a marble counter, soft morning light"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <div>
          <Label>Style</Label>
          <div className="grid grid-cols-2 gap-2">
            {styles.map((s) => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                  style === s
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="ratio">Aspect ratio</Label>
            <Select id="ratio" value={ratio} onChange={(e) => setRatio(e.target.value)}>
              {ratios.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="quality">Quality</Label>
            <Select id="quality" value={quality} onChange={(e) => setQuality(e.target.value)}>
              {qualities.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label>Number of images</Label>
          <div className="flex gap-2">
            {counts.map((c) => (
              <button
                key={c}
                onClick={() => setCount(c)}
                className={`flex-1 rounded-xl border py-2 text-sm font-medium transition-colors ${
                  count === c
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Reference image (optional)</Label>
          <button className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border py-6 text-xs text-muted-foreground hover:bg-muted">
            <Upload className="h-5 w-5" />
            Click to upload a reference image
          </button>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Upload isn&apos;t wired to image-to-image yet — see README for adding it.
          </p>
        </div>

        <Button className="w-full" size="lg" onClick={handleGenerate} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Generate ({creditCost} credits)
            </>
          )}
        </Button>
      </Card>

      <div>
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-4"
            >
              {Array.from({ length: count }).map((_, i) => (
                <div
                  key={i}
                  className="shimmer flex aspect-square items-center justify-center rounded-2xl border border-border"
                >
                  <ImagePlus className="h-8 w-8 text-muted-foreground/40" />
                </div>
              ))}
            </motion.div>
          )}

          {!loading && imageUrls.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 gap-4"
            >
              {imageUrls.map((url) => (
                <div
                  key={url}
                  className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Generated" className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/40 p-2 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                    {[
                      { icon: Download, label: "Download", action: () => window.open(url, "_blank") },
                      { icon: Pencil, label: "Edit", action: () => toast("Image editing (coming soon)") },
                      { icon: Shuffle, label: "Remix", action: handleGenerate },
                      { icon: ZoomIn, label: "Upscale", action: () => toast("Upscaling (coming soon)") },
                    ].map((action) => (
                      <button
                        key={action.label}
                        onClick={action.action}
                        className="rounded-lg p-1.5 text-white hover:bg-white/20"
                        aria-label={action.label}
                      >
                        <action.icon className="h-3.5 w-3.5" />
                      </button>
                    ))}
                    <button
                      onClick={() => handleDelete(url)}
                      className="rounded-lg p-1.5 text-white hover:bg-white/20"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {!loading && imageUrls.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border text-center"
            >
              <ImagePlus className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                Your generated images will appear here.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
