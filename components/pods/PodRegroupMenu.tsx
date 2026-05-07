"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Shuffle, Users, BarChart3 } from "lucide-react";
import {
  computePopoverPosition,
  type Position,
} from "@/lib/utils/popover-position";
import { isUnitOneComplete } from "@/lib/pods/student-score";
import { usePodsStore } from "@/store/pods-store";

export type RegroupChoice = "random" | "mixed" | "leveled";

type Props = {
  triggerRect: DOMRect;
  onSelect: (mode: RegroupChoice) => void;
  onClose: () => void;
};

export function PodRegroupMenu({ triggerRect, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const studentIds = usePodsStore(
    (s) => s.lastInputs?.students.map((st) => st.id) ?? [],
  );
  const unitOneDone = isUnitOneComplete(studentIds);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition(computePopoverPosition(triggerRect, rect.width, rect.height));
  }, [triggerRect]);

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
      "button:not([disabled])",
    );
    first?.focus();
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label="Modo de reagrupación"
      style={{
        position: "fixed",
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        visibility: position ? "visible" : "hidden",
        zIndex: 60,
      }}
      className="w-72 rounded-md border border-slate-200 bg-white shadow-lg overflow-hidden"
    >
      <div className="px-3 py-2 border-b border-slate-200 text-[10px] uppercase tracking-wide font-semibold text-slate-500">
        ¿Cómo quieres reagrupar?
      </div>
      <ul className="py-1">
        <MenuItem
          icon={<Shuffle className="size-4" aria-hidden />}
          label="Aleatoria"
          description="Reparto al azar entre todos los grupos."
          onClick={() => onSelect("random")}
        />
        <MenuItem
          icon={<Users className="size-4" aria-hidden />}
          label="Mixta — equilibrada por nivel"
          description={
            unitOneDone
              ? "2 alumnos avanzados + 2 que aún están encajando, en cada grupo."
              : "Disponible al completar la Unidad 1."
          }
          disabled={!unitOneDone}
          onClick={() => onSelect("mixed")}
        />
        <MenuItem
          icon={<BarChart3 className="size-4" aria-hidden />}
          label="Por niveles — alumnos similares juntos"
          description={
            unitOneDone
              ? "Avanzados juntos para tirar; el resto con material acorde."
              : "Disponible al completar la Unidad 1."
          }
          disabled={!unitOneDone}
          onClick={() => onSelect("leveled")}
        />
      </ul>
    </div>,
    document.body,
  );
}

function MenuItem({
  icon,
  label,
  description,
  disabled = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        role="menuitem"
        disabled={disabled}
        onClick={onClick}
        className={
          disabled
            ? "w-full text-left px-3 py-2 text-xs flex items-start gap-2 text-slate-400 cursor-not-allowed"
            : "w-full text-left px-3 py-2 text-xs flex items-start gap-2 text-slate-700 hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:bg-blue-50"
        }
      >
        <span className="mt-0.5 shrink-0">{icon}</span>
        <span className="flex-1 min-w-0">
          <span className="block font-semibold leading-snug">{label}</span>
          <span className="block text-[10.5px] mt-0.5 leading-snug opacity-80">
            {description}
          </span>
        </span>
      </button>
    </li>
  );
}
