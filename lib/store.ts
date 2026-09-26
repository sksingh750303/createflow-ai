"use client";

// This store now holds ONLY non-authoritative UI state. User identity,
// credits, projects, history, notifications and brand kit all moved to
// Firebase (Auth + Firestore) — see components/providers/auth-provider.tsx
// and lib/hooks.ts. Keeping a tiny UI-only store here (rather than
// removing Zustand entirely) preserves the existing sidebar
// collapse/expand behavior and its instant, no-flicker localStorage read.

import { create } from "zustand";
import { STORAGE_KEYS, getItem, setItem } from "@/lib/storage";

interface UiState {
  hydrated: boolean;
  sidebarCollapsed: boolean;
  hydrate: () => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  hydrated: false,
  sidebarCollapsed: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({
      sidebarCollapsed: getItem<boolean>(STORAGE_KEYS.sidebar, false),
      hydrated: true,
    });
  },

  toggleSidebar: () => {
    const sidebarCollapsed = !get().sidebarCollapsed;
    setItem(STORAGE_KEYS.sidebar, sidebarCollapsed);
    set({ sidebarCollapsed });
  },
}));
