"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  computePopoverPosition,
  type Position,
} from "@/lib/utils/popover-position";
import { MAX_PODS } from "@/lib/pods/group-names";
import type { Pod } from "@/lib/pods/create-pods";

type Props = {
  pods: Pod[];
  currentPodId: string | null;
  triggerRect: DOMRect;
  onSelect: (podId: string | null) => void;
  onCreateAndAssign?: () => void;
  onClose: () => void;
};

export function PodChangeDropdown({
  pods,
  currentPodId,
  triggerRect,
  onSelect,
  onCreateAndAssign,
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
    const first = ref.current?.querySelector<HTMLElement>(
      "button:not([disabled]), [tabindex]:not([tabindex='-1'])",
    );
    first?.focus();
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (typeof window === "undefined") return null;

  const canCreate = pods.length < MAX_PODS && Boolean(onCreateAndAssign);

  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label="Cambiar de grupo"
      style={{
        position: "fixed",
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        visibility: position ? "visible" : "hidden",
        zIndex: 60,
      }}
      className="w-60 rounded-md border border-slate-200 bg-white shadow-lg overflow-hidden"
    >
      <div className="px-3 py-2 border-b border-slate-200 text-[10px] uppercase tracking-wide font-semibold text-slate-500">
        {currentPodId === null ? "Asignar a un grupo" : "Mover a otro grupo"}
      </div>
      <ul className="py-1 max-h-56 overflow-y-auto">
        {pods.map((pod) => {
          const isCurrent = pod.id === currentPodId;
          const isFull = pod.students.length >= pod.maxCapacity;
          const disabled = isFull && !isCurrent;
          return (
            <li key={pod.id}>
              <button
                type="button"
                role="menuitem"
                disabled={disabled}
                onClick={() => onSelect(pod.id)}
                title={disabled ? "Grupo lleno" : undefined}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-xs font-medium flex items-center gap-2",
                  disabled
                    ? "text-slate-400 cursor-not-allowed"
                    : "text-slate-700 hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:bg-blue-50",
                )}
              >
                <span
                  className="inline-block size-3 rounded-full shrink-0"
                  style={{ backgroundColor: pod.color.hex }}
                  aria-hidden
                />
                <span className="flex-1 uppercase tracking-wider font-semibold">
                  {pod.name}
                </span>
                <span className="text-[10px] text-slate-500 tabular-nums">
                  {pod.students.length}/{pod.maxCapacity}
                </span>
                {isCurrent && (
                  <Check
                    className="size-3.5 text-blue-700 shrink-0"
                    aria-hidden
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-slate-200 py-1">
        <button
          type="button"
          role="menuitem"
          onClick={() => onSelect(null)}
          disabled={currentPodId === null}
          className={cn(
            "w-full text-left px-3 py-1.5 text-xs font-medium",
            currentPodId === null
              ? "text-slate-400 cursor-not-allowed"
              : "text-slate-700 hover:bg-slate-50 focus:outline-none focus:bg-slate-50",
          )}
        >
          Pendiente de asignar
        </button>
        {canCreate && (
          <button
            type="button"
            role="menuitem"
            onClick={() => onCreateAndAssign?.()}
            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 focus:outline-none focus:bg-blue-50 flex items-center gap-1.5"
          >
            <Plus className="size-3.5" aria-hidden />
            Crear nuevo grupo
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
