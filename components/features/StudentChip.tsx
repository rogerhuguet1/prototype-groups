"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Student } from "@/lib/types";

interface Props {
  student: Student;
  /** "static" lo usa el DragOverlay (no registra listeners). */
  mode?: "draggable" | "static";
  effectiveScore?: number | null;
  hasOverride?: boolean;
}

export function StudentChip({
  student,
  mode = "draggable",
  effectiveScore,
  hasOverride,
}: Props) {
  const draggable = useDraggable({
    id: `student:${student.id}`,
    disabled: mode === "static",
  });

  const isDragging = mode === "draggable" ? draggable.isDragging : false;
  const showScore =
    effectiveScore !== undefined
      ? effectiveScore
      : (student.performance_score ?? null);

  return (
    <div
      ref={mode === "draggable" ? draggable.setNodeRef : undefined}
      {...(mode === "draggable" ? draggable.listeners : {})}
      {...(mode === "draggable" ? draggable.attributes : {})}
      className={[
        "flex items-center justify-between gap-2 rounded-md border bg-white px-2.5 py-1.5 text-sm shadow-sm",
        "border-slate-200",
        mode === "draggable" ? "cursor-grab active:cursor-grabbing" : "",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400",
        isDragging ? "opacity-40" : "",
      ].join(" ")}
      title={`${student.full_name}${
        showScore !== null ? ` — ${showScore.toFixed(1)}` : ""
      }`}
    >
      <span className="min-w-0 flex-1 truncate text-slate-800">
        {student.full_name}
      </span>
      <span className="flex shrink-0 items-center gap-1">
        {hasOverride && (
          <span
            title="Nota individual ajustada"
            className="rounded bg-amber-100 px-1 text-[10px] text-amber-800"
          >
            ajustada
          </span>
        )}
        {showScore !== null && (
          <span className="text-xs tabular-nums text-slate-500">
            {showScore.toFixed(1)}
          </span>
        )}
      </span>
    </div>
  );
}
