"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Student } from "@/lib/domain/types";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { AssignMenu } from "@/components/dnd/AssignMenu";
import { fullName } from "@/lib/utils/initials";
import { formatScore, scoreBand } from "@/lib/domain/grading";
import { cx } from "@/lib/utils/cx";
import { t } from "@/lib/i18n/strings";

interface StudentChipProps {
  student: Student;
  /** "draggable" registra el chip en DnD; "static" lo usa el DragOverlay. */
  mode?: "draggable" | "static";
  dragging?: boolean;
}

const BAND_TONE = {
  high: "success",
  medium: "warning",
  low: "error",
  none: "neutral",
} as const;

export function StudentChip({ student, mode = "draggable", dragging }: StudentChipProps) {
  const draggable = useDraggable({
    id: `student:${student.id}`,
    disabled: mode === "static",
  });

  const isDragging = mode === "draggable" ? draggable.isDragging : dragging;

  const band = scoreBand(student.baseScore);
  const tone = BAND_TONE[band];

  return (
    <div
      ref={mode === "draggable" ? draggable.setNodeRef : undefined}
      className={cx(
        "group flex items-center gap-3 rounded-lg border bg-white p-2.5",
        "border-rbx-border transition-shadow",
        "hover:shadow-elev-1",
        isDragging && "opacity-35 scale-[0.98]",
      )}
    >
      <button
        type="button"
        {...(mode === "draggable" ? { ...draggable.listeners, ...draggable.attributes } : {})}
        aria-label={t.a11y.drag_handle(fullName(student.firstName, student.lastName))}
        className={cx(
          "flex flex-1 items-center gap-3 text-left",
          mode === "draggable" ? "cursor-grab active:cursor-grabbing" : "",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rbx-primary rounded-md",
        )}
      >
        <Avatar
          firstName={student.firstName}
          lastName={student.lastName}
          score={student.baseScore ?? null}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-rbx-text-primary">
            {fullName(student.firstName, student.lastName)}
          </p>
          <p className="text-xs text-rbx-text-secondary capitalize">{student.level}</p>
        </div>
        <Badge tone={tone}>{formatScore(student.baseScore)}</Badge>
      </button>
      {mode === "draggable" && <AssignMenu student={student} />}
    </div>
  );
}
