"use client";

import { create } from "zustand";
import { generateId } from "@/lib/utils";

export interface ToastItem {
  id: string;
  message: string;
  variant?: "default" | "success" | "error";
}

interface ToastState {
  toasts: ToastItem[];
  show: (message: string, variant?: ToastItem["variant"]) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (message, variant = "default") => {
    const id = generateId("toast");
    set({ toasts: [...get().toasts, { id, message, variant }] });
    setTimeout(() => {
      set({ toasts: get().toasts.filter((t) => t.id !== id) });
    }, 3000);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export function toast(message: string, variant?: ToastItem["variant"]) {
  useToastStore.getState().show(message, variant);
}
