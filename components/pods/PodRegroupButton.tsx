"use client";

import { useRef, useState } from "react";
import { Shuffle, ChevronDown } from "lucide-react";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { PodRegroupMenu, type RegroupChoice } from "./PodRegroupMenu";
import { usePodsStore } from "@/store/pods-store";
import { useHistoryStore } from "@/store/history-store";
import {
  createPodsByLevel,
  createPodsByProgress,
} from "@/lib/pods/create-pods";
import {
  getStudentOverallScore,
  getStudentProgress,
  getStudentScore,
} from "@/lib/pods/student-score";
import { MAX_PODS } from "@/lib/pods/pod-emojis";

function robotCountFor(presentCount: number): number {
  return Math.min(MAX_PODS, Math.max(1, Math.ceil(presentCount / 3)));
}

const MODE_TITLES: Record<RegroupChoice, string> = {
  "by-progress": "¿Reagrupar por avance en el curso?",
  random: "¿Reagrupar al azar?",
  mixed: "¿Reagrupar de forma compensada?",
  leveled: "¿Reagrupar por niveles?",
};

const MODE_DESCRIPTIONS: Record<RegroupChoice, string> = {
  "by-progress":
    "Junta a los alumnos que están en la misma unidad del curso, ordenándolos por nivel dentro. La combinación actual se guardará en el historial.",
  random:
    "Vas a generar una nueva combinación aleatoria. La actual se guardará en el historial.",
  mixed:
    "Cada grupo tendrá una mezcla equilibrada de niveles según las puntuaciones de la Unidad 1. La combinación actual se guardará en el historial.",
  leveled:
    "Los alumnos con puntuación parecida quedarán juntos según la Unidad 1. La combinación actual se guardará en el historial.",
};

const MODE_LABELS: Record<RegroupChoice, string | undefined> = {
  "by-progress": "Asignación por avance en el curso",
  random: undefined,
  mixed: "Asignación compensada (heterogénea)",
  leveled: "Asignación por niveles (homogénea)",
};

export function PodRegroupButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null);
  const [pendingMode, setPendingMode] = useState<RegroupChoice | null>(null);
  const hasPods = usePodsStore((s) => s.pods.length > 0);
  const regroupSelecting = usePodsStore((s) => s.regroupSelecting);
  const enterRegroupSelection = usePodsStore((s) => s.enterRegroupSelection);
  const setCurrentEntryId = usePodsStore((s) => s.setCurrentEntryId);
  const addEntry = useHistoryStore((s) => s.addEntry);

  if (!hasPods) return null;
  if (regroupSelecting) return null;

  const openMenu = () => {
    if (menuRect) {
      setMenuRect(null);
      return;
    }
    const el = buttonRef.current;
    if (!el) return;
    setMenuRect(el.getBoundingClientRect());
  };

  const doLevelRegroup = (mode: Exclude<RegroupChoice, "random">) => {
    const state = usePodsStore.getState();
    const lastInputs = state.lastInputs;
    if (!lastInputs) return;

    const robotCount = robotCountFor(lastInputs.presentCount);

    let result: { pods: typeof state.pods; seed: string };
    if (mode === "by-progress") {
      result = createPodsByProgress({
        students: lastInputs.students,
        presentCount: lastInputs.presentCount,
        robotCount,
        progressFn: getStudentProgress,
        scoreFn: getStudentOverallScore,
      });
    } else {
      result = createPodsByLevel({
        students: lastInputs.students,
        presentCount: lastInputs.presentCount,
        robotCount,
        mode,
        scoreFn: getStudentScore,
      });
    }

    usePodsStore.setState({
      pods: result.pods,
      lockedStudentIds: [],
      regroupConfirmNeeded: true,
      currentSeed: result.seed,
      lastInputs: { ...lastInputs, robotCount },
    });

    const entryId = crypto.randomUUID();
    const label = MODE_LABELS[mode];
    addEntry({
      id: entryId,
      timestamp: new Date().toISOString(),
      classId: state.currentClassId,
      presentStudents: lastInputs.presentCount,
      robotCount,
      seed: result.seed,
      pods: result.pods,
      isFavorite: false,
      evaluations: [],
      evaluatedAt: null,
      lockedStudentIds: [],
      ...(label ? { label } : {}),
    });
    setCurrentEntryId(entryId);
  };

  const onPickMode = (mode: RegroupChoice) => {
    setMenuRect(null);
    if (mode === "random") {
      enterRegroupSelection();
      return;
    }
    setPendingMode(mode);
  };

  return (
    <>
      <Button
        ref={buttonRef}
        variant="secondary"
        onMouseDown={(e) => e.stopPropagation()}
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
          onSelect={onPickMode}
          onClose={() => setMenuRect(null)}
        />
      )}
      <ConfirmDialog
        open={pendingMode !== null && pendingMode !== "random"}
        title={pendingMode ? MODE_TITLES[pendingMode] : ""}
        description={pendingMode ? MODE_DESCRIPTIONS[pendingMode] : ""}
        confirmLabel="Sí, reagrupar"
        cancelLabel="Cancelar"
        onCancel={() => setPendingMode(null)}
        onConfirm={() => {
          if (pendingMode && pendingMode !== "random") {
            doLevelRegroup(pendingMode);
          }
          setPendingMode(null);
        }}
      />
    </>
  );
}
