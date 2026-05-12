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
 * Popover compacto para elegir el nombre del grupo. Lista los 17 nombres en
 * una cuadrícula 2 columnas. Para cada nombre:
 *   - Si lo tiene el pod actual: check azul.
 *   - Si lo tiene otro pod: dot con el color de ese pod (al elegirlo se hace
 *     swap entre los dos pods).
 *   - Si nadie lo usa: simple texto.
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

  // name → pod que lo está usando (o undefined).
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
      className="w-72 rounded-lg border border-slate-200 bg-white shadow-xl overflow-hidden"
    >
      <div className="px-3 py-2 border-b border-slate-200 text-[10px] uppercase tracking-wider font-semibold text-slate-500">
        Nombre del grupo
      </div>
      <ul className="grid grid-cols-2 gap-1 p-2 max-h-[280px] overflow-y-auto">
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
                      ? `Usado por otro grupo — al elegirlo se intercambian los nombres`
                      : "Disponible"
                }
                className={cn(
                  "w-full inline-flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-c360-blue",
                  isCurrent
                    ? "bg-c360-blue text-white"
                    : "text-slate-700 hover:bg-c360-blue/10",
                )}
              >
                <span className="truncate">{name}</span>
                {isCurrent ? (
                  <Check className="size-3.5 shrink-0" aria-hidden />
                ) : isOtherUsed && owner ? (
                  <span
                    aria-hidden
                    title={`En uso por ${owner.name}`}
                    className="inline-block size-2.5 rounded-full shrink-0 ring-1 ring-white"
                    style={{ backgroundColor: owner.color.hex }}
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="px-3 py-1.5 border-t border-slate-200 text-[10px] text-slate-500 leading-tight">
        Tocar un nombre con punto lo intercambia con el grupo que ya lo usa.
      </div>
    </div>,
    document.body,
  );
}
