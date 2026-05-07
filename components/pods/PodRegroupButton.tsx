"use client";

import { useRef, useState } from "react";
import { Shuffle, ChevronDown } from "lucide-react";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { PodRegroupMenu, type RegroupChoice } from "./PodRegroupMenu";
import { usePodsStore } from "@/store/pods-store";
import { useHistoryStore } from "@/store/history-store";
import {
  createPods,
  createPodsByLevel,
} from "@/lib/pods/create-pods";
import { getStudentScore } from "@/lib/pods/student-score";

const MODE_TITLES: Record<RegroupChoice, string> = {
  random: "¿Reagrupar al azar?",
  mixed: "¿Reagrupar de forma mixta?",
  leveled: "¿Reagrupar por niveles?",
};

const MODE_DESCRIPTIONS: Record<RegroupChoice, string> = {
  random:
    "Vas a generar una nueva combinación aleatoria. La actual se guardará en el historial.",
  mixed:
    "Cada grupo tendrá una mezcla equilibrada de niveles según las puntuaciones de la Unidad 1. La combinación actual se guardará en el historial.",
  leveled:
    "Los alumnos con puntuación parecida quedarán juntos según la Unidad 1. La combinación actual se guardará en el historial.",
};

const MODE_LABELS: Record<RegroupChoice, string | undefined> = {
  random: undefined,
  mixed: "Asignación mixta (heterogénea)",
  leveled: "Asignación por niveles (homogénea)",
};

export function PodRegroupButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null);
  const [pendingMode, setPendingMode] = useState<RegroupChoice | null>(null);
  const hasPods = usePodsStore((s) => s.pods.length > 0);
  const setCurrentEntryId = usePodsStore((s) => s.setCurrentEntryId);
  const addEntry = useHistoryStore((s) => s.addEntry);

  if (!hasPods) return null;

  const openMenu = () => {
    if (menuRect) {
      setMenuRect(null);
      return;
    }
    const el = buttonRef.current;
    if (!el) return;
    setMenuRect(el.getBoundingClientRect());
  };

  const doRegroup = (mode: RegroupChoice) => {
    const state = usePodsStore.getState();
    const lastInputs = state.lastInputs;
    if (!lastInputs) return;

    const result =
      mode === "random"
        ? createPods({
            students: lastInputs.students,
            presentCount: lastInputs.presentCount,
            robotCount: lastInputs.robotCount,
          })
        : createPodsByLevel({
            students: lastInputs.students,
            presentCount: lastInputs.presentCount,
            robotCount: lastInputs.robotCount,
            mode,
            scoreFn: getStudentScore,
          });

    usePodsStore.setState({
      pods: result.pods,
      viewWithPods: true,
      sortMode: "grouped",
      regroupConfirmNeeded: true,
      currentSeed: result.seed,
    });

    const entryId = crypto.randomUUID();
    const label = MODE_LABELS[mode];
    addEntry({
      id: entryId,
      timestamp: new Date().toISOString(),
      classId: state.currentClassId,
      presentStudents: lastInputs.presentCount,
      robotCount: lastInputs.robotCount,
      seed: result.seed,
      pods: result.pods,
      isFavorite: false,
      ...(label ? { label } : {}),
    });
    setCurrentEntryId(entryId);
  };

  return (
    <>
      <Button
        ref={buttonRef}
        variant="secondary"
        onClick={openMenu}
        aria-haspopup="menu"
        aria-expanded={Boolean(menuRect)}
        className="text-[11px] font-bold uppercase tracking-wider px-3 py-2"
      >
        <Shuffle className="size-3.5" aria-hidden />
        Reagrupar
        <ChevronDown className="size-3" aria-hidden />
      </Button>
      {menuRect && (
        <PodRegroupMenu
          triggerRect={menuRect}
          onSelect={(mode) => {
            setMenuRect(null);
            setPendingMode(mode);
          }}
          onClose={() => setMenuRect(null)}
        />
      )}
      <ConfirmDialog
        open={pendingMode !== null}
        title={pendingMode ? MODE_TITLES[pendingMode] : ""}
        description={pendingMode ? MODE_DESCRIPTIONS[pendingMode] : ""}
        confirmLabel="Sí, reagrupar"
        cancelLabel="Cancelar"
        onCancel={() => setPendingMode(null)}
        onConfirm={() => {
          if (pendingMode) doRegroup(pendingMode);
          setPendingMode(null);
        }}
      />
    </>
  );
}
