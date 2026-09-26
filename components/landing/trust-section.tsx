"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

function Counter({ target, suffix }: { target: number; suffix: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let frame = 0;
    const totalFrames = 40;
    const step = () => {
      frame++;
      setValue(Math.round((target * frame) / totalFrames));
      if (frame < totalFrames) requestAnimationFrame(step);
      else setValue(target);
    };
    requestAnimationFrame(step);
  }, [inView, target]);

  return (
    <span ref={ref} className="text-4xl font-semibold tracking-tight sm:text-5xl">
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

const stats = [
  { target: 25, suffix: "K+", label: "Creators" },
  { target: 500, suffix: "K+", label: "Generations" },
  { target: 120, suffix: "+", label: "AI Workflows" },
];

export function TrustSection() {
  return (
    <section className="border-y border-border bg-surface-2/50 py-16">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-sm font-medium uppercase tracking-wide text-muted-foreground"
        >
          Trusted by creators, marketers and growing teams
        </motion.p>
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label}>
              <Counter target={s.target} suffix={s.suffix} />
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Demo product statistics for illustration purposes.
        </p>
      </div>
    </section>
  );
}
