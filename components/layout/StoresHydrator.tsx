"use client";

import { useEffect } from "react";
import { usePodsStore } from "@/store/pods-store";
import { useHistoryStore } from "@/store/history-store";

export function StoresHydrator() {
  useEffect(() => {
    void usePodsStore.persist.rehydrate();
    void useHistoryStore.persist.rehydrate();
  }, []);
  return null;
}
