"use client";

import { useEffect } from "react";
import { usePodsStore } from "@/store/pods-store";

export function StoresHydrator() {
  useEffect(() => {
    usePodsStore.persist.rehydrate();
  }, []);
  return null;
}
