"use client";

import { useEffect, useState } from "react";
import { Palette, Upload } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { useBrandKit } from "@/lib/hooks";
import { BrandKit } from "@/types";
import { toast } from "@/lib/toast-store";

const voices = ["Professional", "Friendly", "Bold", "Luxury", "Playful", "Minimal"];

const defaultKit: BrandKit = {
  brandName: "",
  primaryColor: "#7C5CFC",
  secondaryColor: "#22D3EE",
  font: "Inter",
  description: "",
  voice: voices[0],
  audience: "",
};

export default function BrandKitPage() {
  const { brandKit, loading, saveBrandKit } = useBrandKit();
  const [kit, setKit] = useState<BrandKit>(defaultKit);

  useEffect(() => {
    if (brandKit) setKit(brandKit);
  }, [brandKit]);

  function update<K extends keyof BrandKit>(key: K, value: BrandKit[K]) {
    setKit((k) => ({ ...k, [key]: value }));
  }

  async function handleSave() {
    try {
      await saveBrandKit(kit);
      toast("Brand kit saved", "success");
    } catch {
      toast("Couldn't save — please sign in again.", "error");
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight">Brand Kit</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Keep every generation on-brand across the whole platform.
      </p>
      {loading && <p className="mt-2 text-xs text-muted-foreground">Loading…</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="space-y-4 p-5">
          <div>
            <Label htmlFor="brand-name">Brand name</Label>
            <Input id="brand-name" value={kit.brandName} onChange={(e) => update("brandName", e.target.value)} placeholder="e.g. Northwind Coffee" />
          </div>

          <div>
            <Label>Logo</Label>
            <button className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border py-6 text-xs text-muted-foreground hover:bg-muted">
              <Upload className="h-5 w-5" /> Click to upload a logo
            </button>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Uploads go to Supabase Storage — see README for wiring this button to
              lib/supabase/server.ts.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="primary">Primary color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={kit.primaryColor}
                  onChange={(e) => update("primaryColor", e.target.value)}
                  className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent"
                />
                <Input value={kit.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="secondary">Secondary color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={kit.secondaryColor}
                  onChange={(e) => update("secondaryColor", e.target.value)}
                  className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent"
                />
                <Input value={kit.secondaryColor} onChange={(e) => update("secondaryColor", e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="font">Font</Label>
            <Select id="font" value={kit.font} onChange={(e) => update("font", e.target.value)}>
              <option>Inter</option>
              <option>Manrope</option>
              <option>Georgia</option>
              <option>Poppins</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Brand description</Label>
            <Textarea
              id="description"
              placeholder="What does your brand do, and who is it for?"
              value={kit.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="audience">Target audience</Label>
            <Input id="audience" value={kit.audience} onChange={(e) => update("audience", e.target.value)} placeholder="e.g. Independent coffee shop owners" />
          </div>

          <div>
            <Label>Brand voice</Label>
            <div className="grid grid-cols-3 gap-2">
              {voices.map((v) => (
                <button
                  key={v}
                  onClick={() => update("voice", v)}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                    kit.voice === v
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleSave}>Save Brand Kit</Button>
        </Card>

        <Card className="h-fit p-5">
          <h2 className="mb-4 text-sm font-semibold">Preview</h2>
          <div
            className="rounded-2xl border border-border p-5"
            style={{ background: `linear-gradient(135deg, ${kit.primaryColor}22, ${kit.secondaryColor}11)` }}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
              style={{ background: kit.primaryColor }}
            >
              <Palette className="h-4 w-4" />
            </span>
            <p className="mt-3 font-semibold" style={{ fontFamily: kit.font }}>
              {kit.brandName || "Your brand name"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {kit.description || "Your brand description will appear here."}
            </p>
            <span className="mt-3 inline-block rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium">
              {kit.voice} voice
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
