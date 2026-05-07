"use client";

import { Shuffle, X } from "lucide-react";
import { Button } from "../ui/Button";
import { usePodsStore } from "@/store/pods-store";
import { useHistoryStore } from "@/store/history-store";
import { regroupWithLocks, RegroupLocksError } from "@/lib/pods/regroup-with-locks";
import { useState } from "react";
import { ConfirmDialog } from "../ui/ConfirmDialog";

export function PodRegroupSelectionBanner() {
  const regroupSelecting = usePodsStore((s) => s.regroupSelecting);
  const lockedPodCount = usePodsStore(
    (s) => s.pods.filter((p) => p.isLocked).length,
  );
  const lockedStudentCount = usePodsStore(
    (s) => s.lockedStudentIds.length,
  );
  const lockedInLockedPods = usePodsStore((s) =>
    s.pods.reduce((acc, p) => (p.isLocked ? acc + p.students.length : acc), 0),
  );
  const exitRegroupSelection = usePodsStore((s) => s.exitRegroupSelection);
  const setCurrentEntryId = usePodsStore((s) => s.setCurrentEntryId);
  const addEntry = useHistoryStore((s) => s.addEntry);

  const [error, setError] = useState<string | null>(null);

  if (!regroupSelecting) return null;

  const totalLocked = lockedInLockedPods + lockedStudentCount;

  const onConfirm = () => {
    const state = usePodsStore.getState();
    const lastInputs = state.lastInputs;
    if (!lastInputs) {
      exitRegroupSelection();
      return;
    }
    const presentStudents = lastInputs.students.slice(
      0,
      lastInputs.presentCount,
    );
    try {
      const result = regroupWithLocks({
        currentPods: state.pods,
        lockedStudentIds: state.lockedStudentIds,
        allPresentStudents: presentStudents,
      });
      const snapshotLocked = [...state.lockedStudentIds];
      const snapshotPods = result.pods.map((p) => ({ ...p, isLocked: false }));

      usePodsStore.setState({
        pods: snapshotPods,
        lockedStudentIds: [],
        regroupSelecting: false,
        sortMode: state.sortModeBeforeSelection ?? state.sortMode,
        sortModeBeforeSelection: null,
        regroupConfirmNeeded: false,
        currentSeed: result.seed,
        lastInputs: { ...lastInputs, robotCount: snapshotPods.length },
      });

      const entryId = crypto.randomUUID();
      addEntry({
        id: entryId,
        timestamp: new Date().toISOString(),
        classId: state.currentClassId,
        presentStudents: lastInputs.presentCount,
        robotCount: snapshotPods.length,
        seed: result.seed,
        pods: snapshotPods,
        isFavorite: false,
        evaluations: [],
        evaluatedAt: null,
        lockedStudentIds: snapshotLocked,
      });
      setCurrentEntryId(entryId);
    } catch (e) {
      if (e instanceof RegroupLocksError) {
        setError(e.message);
        return;
      }
      throw e;
    }
  };

  const summary = (() => {
    const parts: string[] = [];
    if (lockedPodCount > 0) {
      parts.push(
        `${lockedPodCount} grupo${lockedPodCount === 1 ? "" : "s"} (${lockedInLockedPods} alumno${lockedInLockedPods === 1 ? "" : "s"})`,
      );
    }
    if (lockedStudentCount > 0) {
      parts.push(
        `${lockedStudentCount} alumno${lockedStudentCount === 1 ? "" : "s"} suelto${lockedStudentCount === 1 ? "" : "s"}`,
      );
    }
    if (parts.length === 0) {
      return "No hay nada bloqueado: todos los alumnos rotarán.";
    }
    return `Se mantendrán: ${parts.join(" + ")}.`;
  })();

  return (
    <>
      <div className="sticky top-0 z-30 bg-blue-600 text-white shadow-md">
        <div className="flex items-center gap-3 px-6 py-2">
          <Shuffle className="size-4 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              Selecciona qué grupos o alumnos quieres mantener antes de reagrupar
            </p>
            <p className="text-[11px] text-blue-100 mt-0.5">{summary}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={exitRegroupSelection}
              className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded text-white hover:bg-white/10"
            >
              <X className="size-3.5" aria-hidden />
              Cancelar
            </button>
            <Button
              variant="primary"
              onClick={onConfirm}
              className="bg-white text-blue-700 hover:bg-blue-50 border-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5"
            >
              <Shuffle className="size-3.5" aria-hidden />
              Reagrupar{totalLocked > 0 ? ` respetando ${totalLocked}` : ""}
            </Button>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={error !== null}
        title="No se puede reagrupar"
        description={error ?? ""}
        confirmLabel="Entendido"
        onCancel={() => setError(null)}
        onConfirm={() => setError(null)}
      />
    </>
  );
}
