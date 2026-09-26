"use client";

import Link from "next/link";
import * as Icons from "lucide-react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Tool } from "@/types";
import { Badge } from "@/components/ui/primitives";

export function ToolCard({ tool, index = 0 }: { tool: Tool; index?: number }) {
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[tool.icon] ?? Icons.Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link
        href={`/tools/${tool.slug}`}
        className="group focus-ring flex h-full flex-col rounded-2xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      >
        <div className="flex items-start justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-foreground">{tool.name}</h3>
        <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{tool.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <Badge variant="default">{tool.category}</Badge>
          <span className="text-xs text-muted-foreground">{tool.credits} credits</span>
        </div>
      </Link>
    </motion.div>
  );
}
