"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { usePodsStore } from "@/store/pods-store";
import {
  getStudentOverallScore,
  getStudentProgress,
  getStudentScore,
} from "@/lib/pods/student-score";
import {
  DEFAULT_MAX_PER_POD,
  DEFAULT_MIN_PER_POD,
  type Student,
} from "@/lib/pods/create-pods";
import { MAX_PODS } from "@/lib/pods/pod-emojis";
import {
  GROUPING_MODES,
  groupingSchema,
  type GroupingMode,
} from "@/lib/pods/grouping-schema";
import { cn } from "@/lib/utils/cn";

const MODE_LABELS: Record<GroupingMode, string> = {
  random: "Aleatorio",
  mixed: "Compensada",
  leveled: "Por niveles",
  "by-progress": "Por avance",
};

const MODE_DESCRIPTIONS: Record<GroupingMode, string> = {
  random: "Reparto al azar respetando los candados individuales.",
  mixed: "Cada grupo equilibra niveles según puntuaciones de la Unidad 1.",
  leveled: "Alumnos con puntuación parecida quedan juntos (Unidad 1).",
  "by-progress": "Junta a alumnos que están en la misma unidad del curso.",
};

function defaultRobotCount(presentCount: number, last: number | null): number {
  if (last !== null && last >= 1 && last <= MAX_PODS) return last;
  return Math.min(MAX_PODS, Math.max(1, Math.ceil(presentCount / 4)));
}

type Props = {
  open: boolean;
  onClose: () => void;
  students: Student[];
};

export function PodGroupingModal({ open, onClose, students }: Props) {
  const lastRobotCount = usePodsStore((s) => s.lastRobotCount);
  const createOrRegroup = usePodsStore((s) => s.createOrRegroup);

  const [mode, setMode] = useState<GroupingMode>("random");
  const [presentCount, setPresentCount] = useState<number>(students.length);
  const [robotCount, setRobotCount] = useState<number>(
    defaultRobotCount(students.length, lastRobotCount),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMode("random");
    setPresentCount(students.length);
    setRobotCount(defaultRobotCount(students.length, lastRobotCount));
    setError(null);
  }, [open, students.length, lastRobotCount]);

  const onConfirm = () => {
    const parsed = groupingSchema.safeParse({ mode, presentCount, robotCount });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    const presentStudents = students.slice(0, parsed.data.presentCount);
    try {
      const args: Parameters<typeof createOrRegroup>[0] = {
        mode: parsed.data.mode,
        presentStudents,
        robotCount: parsed.data.robotCount,
      };
      if (parsed.data.mode === "by-progress") {
        args.scoreFn = getStudentOverallScore;
        args.progressFn = getStudentProgress;
      } else if (parsed.data.mode !== "random") {
        args.scoreFn = getStudentScore;
      }
      createOrRegroup(args);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reagrupar"
      description={`Cada grupo tendrá entre ${DEFAULT_MIN_PER_POD} y ${DEFAULT_MAX_PER_POD} alumnos.`}
    >
      <div className="space-y-4">
        <fieldset className="space-y-2">
          <legend className="block text-sm font-medium text-slate-700">
            Modo
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {GROUPING_MODES.map((m) => {
              const selected = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-c360-blue",
                    selected
                      ? "border-c360-blue bg-c360-blue/10 text-c360-text"
                      : "border-slate-200 hover:border-c360-blue/40",
                  )}
                  aria-pressed={selected}
                >
                  <div className="text-sm font-semibold">{MODE_LABELS[m]}</div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-tight">
                    {MODE_DESCRIPTIONS[m]}
                  </div>
                </button>
              );
            })}
          </div>
        </fieldset>
        <Input
          label="Alumnos presentes hoy"
          type="number"
          min={1}
          max={students.length}
          value={presentCount}
          onChange={(e) => {
            const n = Number(e.target.value);
            setPresentCount(Number.isFinite(n) ? n : 0);
          }}
          hint={`En la clase hay ${students.length} alumnos. Reduce este número si hay ausentes.`}
        />
        <Input
          label="Robots disponibles"
          type="number"
          min={1}
          max={MAX_PODS}
          value={robotCount}
          onChange={(e) => {
            const n = Number(e.target.value);
            setRobotCount(Number.isFinite(n) ? n : 0);
          }}
        />
        {error && (
          <div
            role="alert"
            className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
          >
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm}>
            Reagrupar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
