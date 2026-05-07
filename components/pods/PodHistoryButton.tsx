"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { Button } from "../ui/Button";
import { PodHistoryPanel } from "./PodHistoryPanel";
import { useHistoryStore } from "@/store/history-store";

export function PodHistoryButton() {
  const [open, setOpen] = useState(false);
  const entriesCount = useHistoryStore((s) => s.entries.length);

  if (entriesCount === 0) return null;

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setOpen(true)}
        className="text-[11px] font-bold uppercase tracking-wider px-3 py-2 relative"
        title="Ver historial de combinaciones"
      >
        <History className="size-3.5" aria-hidden />
        Historial
        <span className="ml-1 text-[10px] font-bold text-slate-500">
          ({entriesCount})
        </span>
      </Button>
      <PodHistoryPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
