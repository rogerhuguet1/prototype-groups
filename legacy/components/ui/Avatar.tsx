"use client";

import { cx } from "@/lib/utils/cx";
import { initialsOf } from "@/lib/utils/initials";
import { SCORE_BAND_CLASSES, scoreBand } from "@/lib/domain/grading";

interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: "xs" | "sm" | "md" | "lg";
  /**
   * Nota efectiva del alumno. Define el color del avatar según el semáforo
   * (CLAUDE.md §12 + spec rediseño). `null`/`undefined` → tono "sin nota".
   */
  score?: number | null;
  className?: string;
}

const SIZE: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs: "h-7 w-7 text-[11px]",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
};

export function Avatar({
  firstName,
  lastName,
  size = "sm",
  score,
  className,
}: AvatarProps) {
  const band = scoreBand(score);
  const classes = SCORE_BAND_CLASSES[band];
  return (
    <span
      aria-hidden
      className={cx(
        "inline-flex items-center justify-center rounded-full border-2 font-semibold select-none shrink-0 tabular-nums",
        SIZE[size],
        classes.bg,
        classes.border,
        classes.text,
        className,
      )}
    >
      {initialsOf(firstName, lastName)}
    </span>
  );
}
