"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { usePodsStore } from "@/store/pods-store";
import { PodAddStudentMenu } from "./PodAddStudentMenu";
import type { Pod, Student } from "@/lib/pods/create-pods";

type Props = {
  pod: Pod;
  unassigned: Student[];
};

type Position = { top: number; left: number };

export function PodAddStudentButton({ pod, unassigned }: Props) {
  const [position, setPosition] = useState<Position | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const addStudentToPod = usePodsStore((s) => s.addStudentToPod);

  const isFull = pod.students.length >= pod.maxCapacity;
  const noUnassigned = unassigned.length === 0;
  const disabled = isFull || noUnassigned;

  const tooltip = isFull
    ? "Grupo lleno"
    : noUnassigned
      ? "No hay alumnos disponibles"
      : "Añadir alumno al grupo";

  function toggleOpen() {
    if (disabled) return;
    if (position) {
      setPosition(null);
      return;
    }
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition({ top: rect.bottom + 4, left: rect.left });
  }

  function handleSelect(student: Student) {
    addStudentToPod({ id: student.id, full_name: student.full_name }, pod.id);
    setPosition(null);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        disabled={disabled}
        title={tooltip}
        aria-haspopup="menu"
        aria-expanded={Boolean(position)}
        className={cn(
          "size-7 inline-flex items-center justify-center rounded-md border text-sm font-bold transition-colors",
          disabled
            ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500",
        )}
      >
        <Plus className="size-4" aria-hidden />
        <span className="sr-only">{tooltip}</span>
      </button>
      {position && (
        <PodAddStudentMenu
          students={unassigned}
          position={position}
          onSelect={handleSelect}
          onClose={() => setPosition(null)}
        />
      )}
    </>
  );
}
