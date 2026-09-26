"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Film,
  Loader2,
  Maximize,
  Pause,
  Play,
  Sparkles,
  Volume2,
} from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/form";
import { toast } from "@/lib/toast-store";
import { callApi, ApiClientError } from "@/lib/api-client";
import { CREDIT_COSTS } from "@/lib/billing/plans";
import { useAuth } from "@/components/providers/auth-provider";
import { subscribeGeneration } from "@/lib/firebase/firestore";
import { Generation } from "@/types";

const modes = ["Text → Video", "Image → Video", "Script → Video"] as const;
const modeValues = ["text-to-video", "image-to-video", "script-to-video"] as const;
const durations = ["0:15", "0:30", "0:60", "1:30"];
const ratios = ["16:9", "9:16", "1:1"];
const styles = ["Cinematic", "Realistic", "Animated", "3D", "Documentary"];
const cameraMoves = ["Static", "Pan", "Zoom in", "Dolly", "Handheld"];
const voices = ["None", "Narrator (Male)", "Narrator (Female)", "Conversational"];
const music = ["None", "Upbeat", "Cinematic", "Ambient", "Corporate"];

const STAGE_LABELS: Record<string, string> = {
  queued: "Queued — waiting for a render slot",
  processing: "Processing — generating your video",
};

export default function VideoPage() {
  const { firebaseUser } = useAuth();
  const [modeIndex, setModeIndex] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(durations[1]);
  const [ratio, setRatio] = useState(ratios[0]);
  const [style, setStyle] = useState(styles[0]);
  const [camera, setCamera] = useState(cameraMoves[0]);
  const [voice, setVoice] = useState(voices[0]);
  const [track, setTrack] = useState(music[0]);

  const [submitting, setSubmitting] = useState(false);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [playing, setPlaying] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live Firestore listener — reflects webhook OR poll-driven updates
  // instantly without a page refresh.
  useEffect(() => {
    if (!generationId) return;
    const unsubscribe = subscribeGeneration(generationId, setGeneration);
    return unsubscribe;
  }, [generationId]);

  // Client-driven polling fallback — calls our own /api/ai/video/status,
  // which in turn polls the provider and updates Firestore. This is what
  // actually advances the job when no webhook reaches this environment
  // (e.g. local development); in production with webhooks configured,
  // this just becomes a redundant safety net.
  useEffect(() => {
    if (!generationId) return;
    if (generation && ["completed", "failed", "cancelled"].includes(generation.status)) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        await callApi(`/api/ai/video/status?generationId=${generationId}`, { method: "GET" });
      } catch {
        // Swallow — the next tick will retry, and the UI already reflects
        // the last known Firestore state via the listener above.
      }
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationId, generation?.status]);

  async function handleGenerate() {
    if (!prompt.trim()) {
      toast("Describe your video first.", "error");
      return;
    }
    setSubmitting(true);
    setGeneration(null);
    try {
      const result = await callApi<{ generationId: string; status: string }>("/api/ai/video", {
        body: {
          mode: modeValues[modeIndex],
          prompt,
          duration,
          aspectRatio: ratio,
          style,
          cameraMovement: camera,
          voice,
          music: track,
        },
      });
      setGenerationId(result.generationId);
      toast("Video job queued", "success");
    } catch (err) {
      if (err instanceof ApiClientError) toast(err.message, "error");
      else toast("Something went wrong starting the video job.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const isActive = generation && ["queued", "processing"].includes(generation.status);
  const isDone = generation?.status === "completed" && generation.videoUrl;
  const isFailed = generation && ["failed", "cancelled"].includes(generation.status);

  return (
    <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      <Card className="h-fit space-y-4 p-5">
        <div className="flex rounded-xl border border-border bg-surface-2 p-1">
          {modes.map((m, i) => (
            <button
              key={m}
              onClick={() => setModeIndex(i)}
              className={`flex-1 rounded-lg py-1.5 text-[11px] font-medium transition-colors ${
                modeIndex === i ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div>
          <Label htmlFor="video-prompt">Prompt</Label>
          <Textarea
            id="video-prompt"
            placeholder="e.g. A product reveal for a minimalist smart lamp, soft studio lighting"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="duration">Duration</Label>
            <Select id="duration" value={duration} onChange={(e) => setDuration(e.target.value)}>
              {durations.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="ratio">Aspect Ratio</Label>
            <Select id="ratio" value={ratio} onChange={(e) => setRatio(e.target.value)}>
              {ratios.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="style">Visual Style</Label>
            <Select id="style" value={style} onChange={(e) => setStyle(e.target.value)}>
              {styles.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="camera">Camera Movement</Label>
            <Select id="camera" value={camera} onChange={(e) => setCamera(e.target.value)}>
              {cameraMoves.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="voice">Voice</Label>
            <Select id="voice" value={voice} onChange={(e) => setVoice(e.target.value)}>
              {voices.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="music">Music</Label>
            <Select id="music" value={track} onChange={(e) => setTrack(e.target.value)}>
              {music.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={handleGenerate} disabled={submitting || Boolean(isActive)}>
          {submitting || isActive ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> {isActive ? "Job in progress…" : "Starting…"}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Generate ({CREDIT_COSTS.videoGeneration} credits)
            </>
          )}
        </Button>
        {!firebaseUser && (
          <p className="text-xs text-muted-foreground">Sign in to generate video.</p>
        )}
      </Card>

      <div>
        <AnimatePresence mode="wait">
          {isActive && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex aspect-video flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-surface-2/50 p-6 text-center"
            >
              <Film className="h-10 w-10 text-muted-foreground/50" />
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                {STAGE_LABELS[generation!.status] ?? "Working on it…"}
              </div>
              <p className="max-w-xs text-xs text-muted-foreground">
                Video generation can take a few minutes — this page updates automatically
                (no need to keep it open in the foreground; check History later).
              </p>
            </motion.div>
          )}

          {isDone && (
            <motion.div
              key="video"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-black ${
                ratio === "9:16" ? "mx-auto aspect-[9/16] max-w-xs" : "aspect-video"
              }`}
            >
              <video
                src={generation!.videoUrl}
                className="h-full w-full object-contain"
                controls={false}
                autoPlay={playing}
                loop
                muted
                onEnded={() => setPlaying(false)}
              />
              <button
                onClick={() => setPlaying((p) => !p)}
                className="absolute flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
              </button>

              <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-black/40 px-4 py-3 backdrop-blur-sm">
                <button onClick={() => setPlaying((p) => !p)} className="text-white">
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                  <div className={`h-full bg-white ${playing ? "w-full transition-all duration-[8000ms]" : "w-1/3"}`} />
                </div>
                <Volume2 className="h-4 w-4 text-white" />
                <a href={generation!.videoUrl} download className="text-white" aria-label="Download">
                  <Download className="h-4 w-4" />
                </a>
                <button
                  onClick={() => document.querySelector("video")?.requestFullscreen()}
                  className="text-white"
                  aria-label="Fullscreen"
                >
                  <Maximize className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {isFailed && (
            <motion.div
              key="failed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex aspect-video flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-rose-300 text-center"
            >
              <Film className="h-10 w-10 text-rose-400" />
              <p className="text-sm font-medium text-rose-500">
                {generation?.status === "cancelled" ? "Job cancelled" : "Generation failed"}
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                {generation?.errorMessage ?? "Your credits were refunded."}
              </p>
            </motion.div>
          )}

          {!generation && !submitting && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex aspect-video flex-col items-center justify-center rounded-2xl border border-dashed border-border text-center"
            >
              <Film className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                Your generated video will appear here.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
