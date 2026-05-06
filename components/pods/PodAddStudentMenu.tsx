"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { displayName, sortByLastName } from "@/lib/utils/sort-students";
import type { Student } from "@/lib/pods/create-pods";

type Props = {
  students: Student[];
  position: { top: number; left: number };
  onSelect: (student: Student) => void;
  onClose: () => void;
};

export function PodAddStudentMenu({
  students,
  position,
  onSelect,
  onClose,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!(e.target instanceof Node)) return;
      if (!ref.current.contains(e.target)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    const first = ref.current?.querySelector<HTMLElement>(
      "button, [tabindex]:not([tabindex='-1'])",
    );
    first?.focus();
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const sorted = sortByLastName(students);

  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label="Añadir alumno al grupo"
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        zIndex: 60,
      }}
      className="w-72 rounded-md border border-slate-200 bg-white shadow-lg max-h-72 overflow-y-auto"
    >
      <div className="px-3 py-2 border-b border-slate-200 text-[10px] uppercase tracking-wide font-semibold text-slate-500">
        {sorted.length} alumno{sorted.length === 1 ? "" : "s"} sin asignar
      </div>
      <ul className="py-1">
        {sorted.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              role="menuitem"
              onClick={() => onSelect(s)}
              className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:bg-blue-50 focus:text-blue-800"
            >
              {displayName(s.full_name)}
            </button>
          </li>
        ))}
      </ul>
    </div>,
    document.body,
  );
}
