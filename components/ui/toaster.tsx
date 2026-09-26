"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useToastStore } from "@/lib/toast-store";

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 sm:bottom-6 sm:right-6">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            onClick={() => dismiss(t.id)}
            className="glass flex max-w-xs cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-3 shadow-lg"
            role="status"
          >
            {t.variant === "success" && (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            )}
            {t.variant === "error" && (
              <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
            )}
            {(!t.variant || t.variant === "default") && (
              <Info className="h-4 w-4 shrink-0 text-accent" />
            )}
            <span className="text-sm text-foreground">{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
