"use client";

import { useState } from "react";
import { Bookmark, Check } from "lucide-react";
import { Button } from "../ui/Button";
import { usePodsStore } from "@/store/pods-store";
import { useHistoryStore } from "@/store/history-store";

export function PodSaveSnapshotButton() {
  const hasPods = usePodsStore((s) => s.pods.length > 0);
  const addEntry = useHistoryStore((s) => s.addEntry);
  const [justSaved, setJustSaved] = useState(false);

  if (!hasPods) return null;

  const onSave = () => {
    const state = usePodsStore.getState();
    const totalAssigned = state.pods.reduce(
      (acc, p) => acc + p.students.length,
      0,
    );
    addEntry({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      classId: state.currentClassId,
      presentStudents:
        state.lastInputs?.presentCount ?? totalAssigned,
      robotCount: state.pods.length,
      seed: state.currentSeed ?? "manual",
      pods: state.pods,
      isFavorite: false,
    });
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 1500);
  };

  return (
    <Button
      variant="secondary"
      onClick={onSave}
      className="text-[11px] font-bold uppercase tracking-wider px-3 py-2"
      title="Guardar el estado actual de los grupos en el historial"
    >
      {justSaved ? (
        <>
          <Check className="size-3.5 text-emerald-600" aria-hidden />
          Guardado
        </>
      ) : (
        <>
          <Bookmark className="size-3.5" aria-hidden />
          Guardar
        </>
      )}
    </Button>
  );
}
