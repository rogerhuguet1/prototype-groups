"use client";

import { Users } from "lucide-react";
import { Button } from "../ui/Button";
import { usePodsStore } from "@/store/pods-store";

export function PodToggleViewButton() {
  const hasPods = usePodsStore((s) => s.pods.length > 0);
  const viewWithPods = usePodsStore((s) => s.viewWithPods);
  const setViewWithPods = usePodsStore((s) => s.setViewWithPods);

  if (!hasPods) return null;
  if (viewWithPods) return null;

  return (
    <Button
      variant="secondary"
      onClick={() => setViewWithPods(true)}
      className="text-[11px] font-bold uppercase tracking-wider px-3 py-2"
      title="Mostrar la vista con grupos"
    >
      <Users className="size-3.5" aria-hidden />
      Grupos
    </Button>
  );
}
