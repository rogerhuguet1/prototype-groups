"use client";

import { useState } from "react";
import { Bookmark, Check } from "lucide-react";
import { Button } from "../ui/Button";
import { usePodsStore } from "@/store/pods-store";
import { useHistoryStore } from "@/store/history-store";

export function PodSaveSnapshotButton() {
  const hasPods = usePodsStore((s) => s.pods.length > 0);
  const setCurrentEntryId = usePodsStore((s) => s.setCurrentEntryId);
  const addEntry = useHistoryStore((s) => s.addEntry);
  const replaceEntry = useHistoryStore((s) => s.replaceEntry);
  const entries = useHistoryStore((s) => s.entries);
  const [justSaved, setJustSaved] = useState(false);

  if (!hasPods) return null;

  const onSave = () => {
    const state = usePodsStore.getState();
    const totalAssigned = state.pods.reduce(
      (acc, p) => acc + p.students.length,
      0,
    );
    const presentStudents =
      state.lastInputs?.presentCount ?? totalAssigned;
    const robotCount = state.pods.length;
    const seed = state.currentSeed ?? "manual";
    const timestamp = new Date().toISOString();

    const activeId = state.currentEntryId;
    const activeExists =
      activeId !== null && entries.some((e) => e.id === activeId);

    if (activeExists && activeId) {
      replaceEntry(activeId, {
        pods: state.pods,
        timestamp,
        seed,
        presentStudents,
        robotCount,
        lockedStudentIds: state.lockedStudentIds,
      });
    } else {
      const entryId = crypto.randomUUID();
      addEntry({
        id: entryId,
        timestamp,
        classId: state.currentClassId,
        presentStudents,
        robotCount,
        seed,
        pods: state.pods,
        isFavorite: false,
        evaluations: [],
        evaluatedAt: null,
        lockedStudentIds: state.lockedStudentIds,
      });
      setCurrentEntryId(entryId);
    }

    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 1500);
  };

  return (
    <Button
      variant="secondary"
      onClick={onSave}
      className="text-[11px] font-bold uppercase tracking-wider px-3 py-2"
      title="Actualizar la entrada del historial con el estado actual"
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
