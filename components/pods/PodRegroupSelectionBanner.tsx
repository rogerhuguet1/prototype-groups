"use client";

import { Shuffle, Check, Trash2 } from "lucide-react";
import { Button } from "../ui/Button";
import { usePodsStore } from "@/store/pods-store";
import { useHistoryStore } from "@/store/history-store";
import { regroupWithLocks, RegroupLocksError } from "@/lib/pods/regroup-with-locks";
import { useState } from "react";
import { ConfirmDialog } from "../ui/ConfirmDialog";

export function PodRegroupSelectionBanner() {
  const regroupSelecting = usePodsStore((s) => s.regroupSelecting);
  const lockedStudentIds = usePodsStore((s) => s.lockedStudentIds);
  const podsWithLockedCount = usePodsStore((s) => {
    const set = new Set(s.lockedStudentIds);
    return s.pods.filter((p) => p.students.some((st) => set.has(st.id)))
      .length;
  });
  const exitRegroupSelection = usePodsStore((s) => s.exitRegroupSelection);
  const clearAllLocks = usePodsStore((s) => s.clearAllLocks);
  const setCurrentEntryId = usePodsStore((s) => s.setCurrentEntryId);
  const addEntry = useHistoryStore((s) => s.addEntry);

  const [error, setError] = useState<string | null>(null);
  const [iterationCount, setIterationCount] = useState(0);

  if (!regroupSelecting) return null;

  const totalLocked = lockedStudentIds.length;
  const hasAnyLock = totalLocked > 0;

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

      usePodsStore.setState({
        pods: result.pods,
        regroupConfirmNeeded: false,
        currentSeed: result.seed,
        lastInputs: { ...lastInputs, robotCount: result.pods.length },
      });

      const entryId = crypto.randomUUID();
      addEntry({
        id: entryId,
        timestamp: new Date().toISOString(),
        classId: state.currentClassId,
        presentStudents: lastInputs.presentCount,
        robotCount: result.pods.length,
        seed: result.seed,
        pods: result.pods.map((p) => ({ ...p, isLocked: false })),
        isFavorite: false,
        evaluations: [],
        evaluatedAt: null,
        lockedStudentIds: snapshotLocked,
      });
      setCurrentEntryId(entryId);
      setIterationCount((n) => n + 1);
    } catch (e) {
      if (e instanceof RegroupLocksError) {
        setError(e.message);
        return;
      }
      throw e;
    }
  };

  const onExit = () => {
    setIterationCount(0);
    exitRegroupSelection();
  };

  const summary = (() => {
    if (totalLocked === 0) {
      if (iterationCount === 0) {
        return "No hay nada bloqueado: todos los alumnos rotarán al reagrupar.";
      }
      return "Sin bloqueos. Marca de nuevo lo que quieras conservar y reagrupa otra vez, o pulsa Salir.";
    }
    const sufA = totalLocked === 1 ? "" : "s";
    const sufG = podsWithLockedCount === 1 ? "" : "s";
    return `Se mantendrán ${totalLocked} alumno${sufA} bloqueado${sufA} (en ${podsWithLockedCount} grupo${sufG}).`;
  })();

  const headline =
    iterationCount === 0
      ? "Selecciona qué grupos o alumnos quieres mantener antes de reagrupar"
      : `Reagrupado ${iterationCount}× — sigue iterando o pulsa Salir cuando estés contento`;

  return (
    <>
      <div className="sticky top-0 z-30 bg-blue-600 text-white shadow-md">
        <div className="flex items-center gap-3 px-6 py-2">
          <Shuffle className="size-4 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{headline}</p>
            <p className="text-[11px] text-blue-100 mt-0.5">{summary}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {hasAnyLock && (
              <button
                type="button"
                onClick={clearAllLocks}
                className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded text-white hover:bg-white/10"
                title="Quitar todos los bloqueos"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Quitar todos los bloqueos
              </button>
            )}
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded text-white hover:bg-white/10"
            >
              <Check className="size-3.5" aria-hidden />
              Salir
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
