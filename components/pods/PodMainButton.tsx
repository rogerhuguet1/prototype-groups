"use client";

import { useRef, useState } from "react";
import { List, Shuffle, ChevronDown, LayoutGrid } from "lucide-react";
import { Button } from "../ui/Button";
import { PodRegroupModeDropdown } from "./PodRegroupModeDropdown";
import { PodCountControls } from "./PodCountControls";
import { usePodsStore } from "@/store/pods-store";
import {
  getStudentOverallScore,
  getStudentProgress,
  getStudentScore,
} from "@/lib/pods/student-score";
import { MAX_PODS } from "@/lib/pods/pod-emojis";
import type { Student } from "@/lib/pods/create-pods";
import type { GroupingMode } from "@/lib/pods/grouping-schema";

type Props = {
  students: Student[];
};

function defaultRobotCount(presentCount: number): number {
  return Math.min(MAX_PODS, Math.max(1, Math.ceil(presentCount / 4)));
}

export function PodMainButton({ students }: Props) {
  const sortMode = usePodsStore((s) => s.sortMode);
  const setSortMode = usePodsStore((s) => s.setSortMode);
  const createOrRegroup = usePodsStore((s) => s.createOrRegroup);
  const podCount = usePodsStore((s) => s.pods.length);
  const hasPods = podCount > 0;

  const dropdownTriggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (students.length === 0) return null;

  // === Modo grouped: Lista + counts + dropdown Reagrupar ===
  if (sortMode === "grouped") {
    const onPickMode = (mode: GroupingMode) => {
      setDropdownRect(null);
      const presentStudents = students.map((s) => ({
        id: s.id,
        full_name: s.full_name,
      }));
      const robotCount = podCount;
      try {
        const args: Parameters<typeof createOrRegroup>[0] = {
          mode,
          presentStudents,
          robotCount,
        };
        if (mode === "by-progress") {
          args.scoreFn = getStudentOverallScore;
          args.progressFn = getStudentProgress;
        } else if (mode !== "random") {
          args.scoreFn = getStudentScore;
        }
        createOrRegroup(args);
      } catch (e) {
        setError((e as Error).message);
        window.setTimeout(() => setError(null), 4000);
      }
    };

    const onOpenDropdown = () => {
      if (dropdownRect) {
        setDropdownRect(null);
        return;
      }
      const el = dropdownTriggerRef.current;
      if (!el) return;
      setDropdownRect(el.getBoundingClientRect());
    };

    return (
      <>
        <Button
          variant="secondary"
          onClick={() => setSortMode("alphabetical")}
          className="text-[11px] font-bold uppercase tracking-wider px-3 py-2"
          title="Volver a la lista alfabética"
        >
          <List className="size-3.5" aria-hidden />
          Lista
        </Button>
        <PodCountControls students={students} />
        <Button
          ref={dropdownTriggerRef}
          variant="secondary"
          onClick={onOpenDropdown}
          aria-haspopup="menu"
          aria-expanded={Boolean(dropdownRect)}
          className="text-[11px] font-bold uppercase tracking-wider px-3 py-2"
          title="Reagrupar por otro criterio"
        >
          <Shuffle className="size-3.5" aria-hidden />
          Reagrupar
          <ChevronDown className="size-3" aria-hidden />
        </Button>
        {dropdownRect && (
          <PodRegroupModeDropdown
            triggerRect={dropdownRect}
            onSelect={onPickMode}
            onClose={() => setDropdownRect(null)}
          />
        )}
        {error && (
          <div
            role="alert"
            className="fixed top-4 right-4 z-[70] max-w-sm rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 shadow-lg"
          >
            {error}
          </div>
        )}
      </>
    );
  }

  // === Modo alphabetical ===
  if (hasPods) {
    return (
      <Button
        variant="secondary"
        onClick={() => setSortMode("grouped")}
        className="text-[11px] font-bold uppercase tracking-wider px-3 py-2"
        title="Ver la vista por grupos"
      >
        <LayoutGrid className="size-3.5" aria-hidden />
        Grupos
      </Button>
    );
  }

  // Sin pods (fallback): el auto-agrupar inicial ya pasó pero el profe elimino
  // todos los grupos. Ofrecemos un boton para volver a agrupar con defaults.
  const onAutoGroup = () => {
    const presentStudents = students.map((s) => ({
      id: s.id,
      full_name: s.full_name,
    }));
    createOrRegroup({
      mode: "random",
      presentStudents,
      robotCount: defaultRobotCount(students.length),
    });
  };

  return (
    <Button
      variant="secondary"
      onClick={onAutoGroup}
      className="text-[11px] font-bold uppercase tracking-wider px-3 py-2"
      title="Agrupar a los alumnos"
    >
      <Shuffle className="size-3.5" aria-hidden />
      Agrupar
    </Button>
  );
}
