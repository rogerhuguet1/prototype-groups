"use client";

import { useEffect } from "react";
import { usePodsStore } from "@/store/pods-store";

export function StoresHydrator() {
  useEffect(() => {
    void usePodsStore.persist.rehydrate();
  }, []);
  return null;
}
