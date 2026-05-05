"use client";

import type { ReactNode } from "react";
import { cx } from "@/lib/utils/cx";

type BadgeTone = "neutral" | "success" | "warning" | "error" | "info" | "accent";

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  leadingIcon?: ReactNode;
  className?: string;
}

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-rbx-surface-muted text-rbx-text-secondary border-rbx-border",
  success: "bg-rbx-success/12 text-rbx-success border-rbx-success/30",
  warning: "bg-rbx-warning/12 text-rbx-warning border-rbx-warning/30",
  error: "bg-rbx-error/12 text-rbx-error border-rbx-error/30",
  info: "bg-rbx-info/12 text-rbx-info border-rbx-info/30",
  accent: "bg-rbx-accent/15 text-rbx-text-primary border-rbx-accent/40",
};

export function Badge({ tone = "neutral", children, leadingIcon, className }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {leadingIcon}
      {children}
    </span>
  );
}
