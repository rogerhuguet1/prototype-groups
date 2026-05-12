"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils/cn";
import {
  computePopoverPosition,
  type Position,
} from "@/lib/utils/popover-position";
import { GROUP_NAMES } from "@/lib/pods/group-names";
import { usePodsStore } from "@/store/pods-store";
import type { Pod } from "@/lib/pods/create-pods";

type Props = {
  pod: Pod;
  triggerRect: DOMRect;
  onClose: () => void;
};

/**
 * Popover para elegir el nombre del grupo. Mismo diseño visual que
 * `PodChangeDropdown` (lista vertical con dot de color + nombre en
 * mayúsculas + check), para que ambos popovers se sientan uniformes.
 *
 * Por nombre:
 *   - Si lo tiene el pod actual: check azul a la derecha.
 *   - Si lo tiene otro pod: dot del color del otro pod (al elegirlo se hace
 *     swap entre los dos pods).
 *   - Si nadie lo usa: dot vacío con borde dashed.
 */
export function PodNamePicker({ pod, triggerRect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position | null>(null);

  const { allPods, renamePod } = usePodsStore(
    useShallow((s) => ({
      allPods: s.pods,
      renamePod: s.renamePod,
    })),
  );

  const nameToPod = useMemo(() => {
    const m = new Map<string, Pod>();
    allPods.forEach((p) => m.set(p.name, p));
    return m;
  }, [allPods]);

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

  const onPick = (name: string) => {
    renamePod(pod.id, name);
    onClose();
  };

  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label="Elegir nombre del grupo"
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
        Cambiar nombre del grupo
      </div>
      <ul className="py-1 max-h-56 overflow-y-auto">
        {GROUP_NAMES.map((name) => {
          const owner = nameToPod.get(name);
          const isCurrent = owner?.id === pod.id;
          const isOtherUsed = Boolean(owner) && !isCurrent;
          return (
            <li key={name}>
              <button
                type="button"
                role="menuitem"
                onClick={() => onPick(name)}
                aria-current={isCurrent}
                title={
                  isCurrent
                    ? "Nombre actual"
                    : isOtherUsed
                      ? `En uso por otro grupo — al elegirlo se intercambian los nombres`
                      : "Disponible"
                }
                className={cn(
                  "w-full text-left px-3 py-1.5 text-xs font-medium flex items-center gap-2",
                  "text-slate-700 hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:bg-blue-50",
                )}
              >
                {owner ? (
                  <span
                    className="inline-block size-3 rounded-full shrink-0"
                    style={{ backgroundColor: owner.color.hex }}
                    aria-hidden
                  />
                ) : (
                  <span
                    className="inline-block size-3 rounded-full shrink-0 border border-dashed border-slate-300"
                    aria-hidden
                  />
                )}
                <span className="flex-1 uppercase tracking-wider font-semibold">
                  {name}
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
      <div className="border-t border-slate-200 px-3 py-1.5 text-[10px] text-slate-500 leading-tight">
        Nombre con dot de color = en uso por otro grupo (se intercambian al elegirlo).
      </div>
    </div>,
    document.body,
  );
}
