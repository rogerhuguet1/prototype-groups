"use client";

import { useState } from "react";
import { Shuffle } from "lucide-react";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { usePodsStore } from "@/store/pods-store";
import { useHistoryStore } from "@/store/history-store";

export function PodRegroupButton() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const hasPods = usePodsStore((s) => s.pods.length > 0);
  const regroupConfirmNeeded = usePodsStore((s) => s.regroupConfirmNeeded);
  const regroup = usePodsStore((s) => s.regroup);
  const addEntry = useHistoryStore((s) => s.addEntry);

  if (!hasPods) return null;

  const doRegroup = () => {
    const state = usePodsStore.getState();
    const result = regroup();
    if (!result.ok) return;
    const lastInputs = state.lastInputs;
    if (!lastInputs) return;
    addEntry({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      classId: state.currentClassId,
      presentStudents: lastInputs.presentCount,
      robotCount: lastInputs.robotCount,
      seed: result.seed,
      pods: result.pods,
      isFavorite: false,
    });
  };

  const onClick = () => {
    if (regroupConfirmNeeded) {
      setConfirmOpen(true);
    } else {
      doRegroup();
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        onClick={onClick}
        className="text-[11px] font-bold uppercase tracking-wider px-3 py-2"
      >
        <Shuffle className="size-3.5" aria-hidden />
        Reagrupar
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        title="¿Reagrupar de nuevo?"
        description="Vas a generar una nueva combinación. La actual se guardará en el historial y podrás recuperarla desde ahí."
        confirmLabel="Sí, reagrupar"
        cancelLabel="Cancelar"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          doRegroup();
        }}
      />
    </>
  );
}
