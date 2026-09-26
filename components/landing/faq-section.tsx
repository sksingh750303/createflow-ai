"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Is CreateFlow AI free to use?",
    a: "Yes. The Free plan includes 100 credits per month across every AI tool, no credit card required.",
  },
  {
    q: "Do I need any technical skills to use it?",
    a: "No. Every tool is guided — just describe what you need and CreateFlow AI generates it for you.",
  },
  {
    q: "What are credits?",
    a: "Credits are used each time you generate content. Text generations use fewer credits than images or video.",
  },
  {
    q: "Can I cancel or change my plan anytime?",
    a: "Yes, you can upgrade, downgrade or cancel from your billing settings at any time.",
  },
  {
    q: "Is this connected to a real AI API?",
    a: "This build runs in demo mode with a local mock AI engine so it works fully offline, with no API keys required.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
        Frequently asked questions
      </h2>
      <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-surface">
        {faqs.map((faq, i) => (
          <div key={faq.q} className="px-5">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="focus-ring flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium"
              aria-expanded={open === i}
            >
              {faq.q}
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                  open === i ? "rotate-180" : ""
                }`}
              />
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="pb-4 text-sm text-muted-foreground">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}
