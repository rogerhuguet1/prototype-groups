"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { POD_EMOJIS } from "@/lib/pods/pod-emojis";
import { cn } from "@/lib/utils/cn";
import { computePopoverPosition, type Position } from "@/lib/utils/popover-position";
import type { Pod } from "@/lib/pods/create-pods";

type Props = {
  pod: Pod;
  emojisInUse: ReadonlySet<string>;
  triggerRect: DOMRect;
  onSelect: (emoji: string, label: string) => void;
  onClose: () => void;
};

export function PodEmojiPicker({
  pod,
  emojisInUse,
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
      aria-label="Cambiar emoji del grupo"
      style={{
        position: "fixed",
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        visibility: position ? "visible" : "hidden",
        zIndex: 60,
      }}
      className="rounded-md border border-slate-200 bg-white shadow-lg p-2 w-[232px]"
    >
      <p className="text-[10px] uppercase tracking-wide font-semibold text-slate-500 px-1 pb-1.5">
        Cambiar emoji del grupo
      </p>
      <ul className="grid grid-cols-5 gap-1">
        {POD_EMOJIS.map((e) => {
          const isCurrent = e.emoji === pod.emoji;
          const isInUse = emojisInUse.has(e.emoji) && !isCurrent;
          return (
            <li key={e.emoji}>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={isCurrent}
                disabled={isInUse}
                title={isInUse ? "En uso" : e.label}
                onClick={() => onSelect(e.emoji, e.label)}
                className={cn(
                  "size-10 inline-flex items-center justify-center rounded text-xl transition-colors",
                  isInUse
                    ? "opacity-40 cursor-not-allowed"
                    : isCurrent
                      ? "ring-2 ring-blue-600 bg-blue-50"
                      : "hover:bg-slate-100 focus:outline-none focus:bg-slate-100",
                )}
              >
                {e.emoji}
              </button>
            </li>
          );
        })}
      </ul>
    </div>,
    document.body,
  );
}
