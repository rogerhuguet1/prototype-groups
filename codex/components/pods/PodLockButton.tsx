"use client";

import { Lock, LockOpen } from "lucide-react";

type Props = {
  locked: boolean;
  onToggle: () => void;
  label: string;
  colorHex?: string;
  size?: "sm" | "md";
};

export function PodLockButton({
  locked,
  onToggle,
  label,
  colorHex,
  size = "md",
}: Props) {
  const sizePx = size === "sm" ? "size-5" : "size-6";
  const iconSize = size === "sm" ? "size-3" : "size-3.5";
  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={label}
      title={label}
      aria-pressed={locked}
      className={`${sizePx} inline-flex items-center justify-center rounded transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        locked
          ? "text-white shadow-sm"
          : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
      }`}
      style={
        locked && colorHex ? { backgroundColor: colorHex } : undefined
      }
    >
      {locked ? (
        <Lock className={iconSize} aria-hidden />
      ) : (
        <LockOpen className={iconSize} aria-hidden />
      )}
    </button>
  );
}
