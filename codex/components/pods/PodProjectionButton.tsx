"use client";

import { useState } from "react";
import { Presentation } from "lucide-react";
import { Button } from "../ui/Button";
import { PodProjectionModal } from "./PodProjectionModal";
import { usePodsStore } from "@/store/pods-store";

export function PodProjectionButton() {
  const [open, setOpen] = useState(false);
  const hasPods = usePodsStore((s) => s.pods.length > 0);

  if (!hasPods) return null;

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setOpen(true)}
        className="text-[11px] font-bold uppercase tracking-wider px-3 py-2"
        title="Proyectar los grupos a pantalla completa"
      >
        <Presentation className="size-3.5" aria-hidden />
        Proyección
      </Button>
      <PodProjectionModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
