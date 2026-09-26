"use client";

import { useEffect } from "react";
import { useUiStore } from "@/lib/store";

export function AppHydrator() {
  const hydrate = useUiStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return null;
}
