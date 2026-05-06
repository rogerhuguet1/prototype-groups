"use client";

import { Checkbox } from "../ui/Checkbox";
import { usePodsStore } from "@/store/pods-store";

export function PodViewToggle() {
  const viewWithPods = usePodsStore((s) => s.viewWithPods);
  const setViewWithPods = usePodsStore((s) => s.setViewWithPods);

  return (
    <Checkbox
      label="Vista con Grupos"
      checked={viewWithPods}
      onChange={(e) => setViewWithPods(e.target.checked)}
    />
  );
}
