"use client";

import { motion } from "framer-motion";
import { Lightbulb, Sparkles, Rocket, Wand2 } from "lucide-react";

const steps = [
  { title: "Describe what you need", desc: "Tell CreateFlow AI your topic, product or idea.", icon: Lightbulb },
  { title: "AI generates instantly", desc: "Our engine drafts content, images, or video in seconds.", icon: Wand2 },
  { title: "Refine with AI tools", desc: "Rewrite, expand, change tone or optimize for SEO.", icon: Sparkles },
  { title: "Publish anywhere", desc: "Export, copy, or push straight to your favorite tools.", icon: Rocket },
];

export function WorkflowSection() {
  return (
    <section className="border-y border-border bg-surface-2/40 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            From idea to published in four steps
          </h2>
          <p className="mt-3 text-muted-foreground">
            One consistent workflow across every AI tool on the platform.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="relative rounded-2xl border border-border bg-surface p-6"
            >
              <span className="text-xs font-semibold text-muted-foreground">
                Step {i + 1}
              </span>
              <step.icon className="mt-3 h-6 w-6 text-accent" />
              <h4 className="mt-3 font-semibold">{step.title}</h4>
              <p className="mt-1.5 text-sm text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
