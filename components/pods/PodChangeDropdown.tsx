"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Pod } from "@/lib/pods/create-pods";

type Props = {
  pods: Pod[];
  currentPodId: string | null;
  position: { top: number; left: number };
  onSelect: (podId: string | null) => void;
  onClose: () => void;
};

export function PodChangeDropdown({
  pods,
  currentPodId,
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
      "button:not([disabled]), [tabindex]:not([tabindex='-1'])",
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
      aria-label="Cambiar de grupo"
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        zIndex: 60,
      }}
      className="w-60 rounded-md border border-slate-200 bg-white shadow-lg max-h-72 overflow-y-auto"
    >
      <div className="px-3 py-2 border-b border-slate-200 text-[10px] uppercase tracking-wide font-semibold text-slate-500">
        Mover a otro grupo
      </div>
      <ul className="py-1">
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
                  className="inline-flex size-5 items-center justify-center rounded text-[12px] leading-none shrink-0"
                  style={{ backgroundColor: pod.color.hex }}
                >
                  {pod.emoji}
                </span>
                <span className="flex-1">Grupo {pod.emoji}</span>
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
          Sin grupo
        </button>
      </div>
    </div>,
    document.body,
  );
}
