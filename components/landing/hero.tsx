"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Image as ImageIcon, LayoutDashboard, Megaphone, PenLine, Sparkles, TrendingUp, Video, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const floatingCards = [
  { label: "Article generated", icon: PenLine, className: "left-[-2%] top-[8%] sm:left-[2%]" },
  { label: "Image created", icon: ImageIcon, className: "right-[-2%] top-[18%] sm:right-[2%]" },
  { label: "SEO score 94", icon: TrendingUp, className: "left-[0%] bottom-[10%] sm:left-[4%]" },
  { label: "Social post ready", icon: Megaphone, className: "right-[0%] bottom-[2%] sm:right-[4%]" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="animated-gradient-bg absolute inset-0 -z-10" />
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-14 text-center sm:px-6 sm:pt-20 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-muted-foreground"
        >
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          Powered by AI
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mx-auto max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
        >
          One AI Workspace.
          <br />
          <span className="gradient-text">Everything You Need to Create.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground"
        >
          Write, design, optimize and publish with one intelligent creative
          workspace.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto">
              Start Creating Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/tools">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              Explore AI Tools
            </Button>
          </Link>
        </motion.div>

        {/* Product preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.28 }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="relative rounded-3xl border border-border bg-surface p-2 shadow-2xl sm:p-3">
            <div className="overflow-hidden rounded-2xl border border-border bg-surface-2">
              <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="flex flex-col sm:flex-row">
                <div className="hidden w-44 flex-col gap-1 border-r border-border p-3 sm:flex">
                  {[
                    { label: "Dashboard", icon: LayoutDashboard, active: true },
                    { label: "AI Writer", icon: PenLine },
                    { label: "Image", icon: ImageIcon },
                    { label: "Video", icon: Video },
                    { label: "Social", icon: Megaphone },
                    { label: "SEO", icon: TrendingUp },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium ${
                        item.active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </div>
                  ))}
                </div>
                <div className="flex-1 p-5 text-left sm:p-6">
                  <p className="text-sm text-muted-foreground">Good morning, Creator</p>
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3">
                    <Wand2 className="h-4 w-4 text-accent" />
                    <span className="text-sm text-muted-foreground">
                      What do you want to create today?
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {[
                      { title: "AI Writer", desc: "Generate long-form content", icon: PenLine },
                      { title: "AI Image", desc: "Create visuals", icon: ImageIcon },
                      { title: "AI Video", desc: "Turn ideas into video", icon: Video },
                      { title: "Social Media", desc: "Create social campaigns", icon: Megaphone },
                    ].map((card) => (
                      <div
                        key={card.title}
                        className="rounded-xl border border-border bg-surface p-3.5"
                      >
                        <card.icon className="h-4 w-4 text-accent" />
                        <p className="mt-2 text-sm font-medium">{card.title}</p>
                        <p className="text-xs text-muted-foreground">{card.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {floatingCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
              className={`animate-float glass absolute hidden items-center gap-2 rounded-xl border border-border px-3.5 py-2.5 text-xs font-medium shadow-lg sm:flex ${card.className}`}
              style={{ animationDelay: `${i * 0.7}s` }}
            >
              <card.icon className="h-3.5 w-3.5 text-emerald-500" />
              {card.label}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export function AnnouncementBar() {
  return (
    <div className="animated-gradient-bg border-b border-border py-2 text-center text-xs font-medium text-foreground/90 sm:text-sm">
      <span className="inline-flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5" />
        New: AI Generator is now in live — explore it in AI Tools.
      </span>
    </div>
  );
}
