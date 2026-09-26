// Small typed wrapper around localStorage with SSR safety.
//
// IMPORTANT: localStorage is UI-preference storage only in this app —
// theme, sidebar collapse state, and unsaved drafts. Everything
// authoritative (identity, credits, projects, generations, notifications,
// brand kit) lives in Firestore. Never add a new key here for anything
// that should be trusted server-side.

export function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setItem<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / serialization errors
  }
}

export function removeItem(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

export const STORAGE_KEYS = {
  theme: "cfa_theme",
  sidebar: "cfa_sidebar_collapsed",
  /** Prefix for unsaved-draft autosave, e.g. `cfa_draft_writer`. Drafts are
   * local-only convenience and are never treated as saved/authoritative
   * content — saving still requires an explicit Save action that writes
   * to Firestore. */
  draftPrefix: "cfa_draft_",
} as const;
