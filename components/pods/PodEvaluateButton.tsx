"use client";

import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { Button } from "../ui/Button";
import { PodEvaluateModal } from "./PodEvaluateModal";
import { usePodsStore } from "@/store/pods-store";
import { useHistoryStore } from "@/store/history-store";

export function PodEvaluateButton() {
  const [open, setOpen] = useState(false);
  const hasPods = usePodsStore((s) => s.pods.length > 0);
  const currentEntryId = usePodsStore((s) => s.currentEntryId);
  const activeEntry = useHistoryStore((s) =>
    currentEntryId ? s.entries.find((e) => e.id === currentEntryId) ?? null : null,
  );
  const saveEvaluation = useHistoryStore((s) => s.saveEvaluation);

  if (!hasPods || !activeEntry) return null;

  const isEvaluated = activeEntry.evaluations.length > 0;

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setOpen(true)}
        className="text-[11px] font-bold uppercase tracking-wider px-3 py-2"
        title={
          isEvaluated
            ? "Editar la evaluación de la sesión"
            : "Evaluar cómo ha ido la sesión"
        }
      >
        <ClipboardCheck className="size-3.5" aria-hidden />
        Evaluar sesión
        {isEvaluated && (
          <span className="ml-1 size-1.5 rounded-full bg-emerald-500" aria-hidden />
        )}
      </Button>
      {open && activeEntry && (
        <PodEvaluateModal
          open={open}
          entry={activeEntry}
          onClose={() => setOpen(false)}
          onSave={(evaluations) => {
            saveEvaluation(activeEntry.id, evaluations);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
