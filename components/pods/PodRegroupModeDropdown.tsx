"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Shuffle, Scale, BarChart3, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  computePopoverPosition,
  type Position,
} from "@/lib/utils/popover-position";
import type { GroupingMode } from "@/lib/pods/grouping-schema";
import type { LucideIcon } from "lucide-react";

type Props = {
  triggerRect: DOMRect;
  onSelect: (mode: GroupingMode) => void;
  onClose: () => void;
};

type Entry = {
  mode: GroupingMode;
  label: string;
  description: string;
  Icon: LucideIcon;
};

const ENTRIES: Entry[] = [
  {
    mode: "random",
    label: "Aleatorio",
    description: "Reparto al azar respetando candados.",
    Icon: Shuffle,
  },
  {
    mode: "mixed",
    label: "Compensada",
    description: "Equilibra niveles en cada grupo.",
    Icon: Scale,
  },
  {
    mode: "leveled",
    label: "Por niveles",
    description: "Junta alumnos con puntuación parecida.",
    Icon: BarChart3,
  },
  {
    mode: "by-progress",
    label: "Por avance",
    description: "Junta alumnos en la misma unidad.",
    Icon: TrendingUp,
  },
];

export function PodRegroupModeDropdown({
  triggerRect,
  onSelect,
  onClose,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position | null>(null);

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
    ref.current
      ?.querySelector<HTMLElement>(
        "button:not([disabled]), [tabindex]:not([tabindex='-1'])",
      )
      ?.focus();
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
      aria-label="Reagrupar por"
      style={{
        position: "fixed",
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        visibility: position ? "visible" : "hidden",
        zIndex: 60,
      }}
      className="w-64 rounded-md border border-slate-200 bg-white shadow-lg overflow-hidden"
    >
      <div className="px-3 py-2 border-b border-slate-200 text-[10px] uppercase tracking-wide font-semibold text-slate-500">
        Reagrupar por
      </div>
      <ul className="py-1">
        {ENTRIES.map((entry) => {
          const { Icon } = entry;
          return (
            <li key={entry.mode}>
              <button
                type="button"
                role="menuitem"
                onClick={() => onSelect(entry.mode)}
                className={cn(
                  "w-full text-left px-3 py-2 flex items-start gap-2",
                  "text-slate-700 hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:bg-blue-50",
                )}
              >
                <Icon className="size-4 mt-0.5 shrink-0" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold leading-tight">
                    {entry.label}
                  </span>
                  <span className="block text-[11px] text-slate-500 mt-0.5 leading-tight">
                    {entry.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>,
    document.body,
  );
}
