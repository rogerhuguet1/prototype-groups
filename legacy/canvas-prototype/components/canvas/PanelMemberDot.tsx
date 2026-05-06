"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Student } from "@/lib/domain/types";
import { Avatar } from "@/components/ui/Avatar";
import { fullName } from "@/lib/utils/initials";
import { formatScore } from "@/lib/domain/grading";
import { cx } from "@/lib/utils/cx";
import { t } from "@/lib/i18n/strings";

interface Props {
  student: Student;
  /** Nota efectiva del alumno (override individual ?? grupal ?? base). */
  effectiveScore: number | null;
  /** Marca visual cuando hay override individual respecto a la nota grupal. */
  hasOverride?: boolean;
}

/**
 * Chip circular pequeño que vive dentro del círculo grande del grupo.
 * Muestra solo iniciales para que quepan; el nombre completo y la nota
 * van al `title` y al `aria-label` (accesibilidad + tooltip nativo).
 */
export function PanelMemberDot({ student, effectiveScore, hasOverride }: Props) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `student:${student.id}`,
  });

  const fullLabel = `${fullName(student.firstName, student.lastName)} — ${formatScore(effectiveScore)}`;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      aria-label={t.a11y.drag_handle(fullLabel)}
      title={fullLabel}
      className={cx(
        "relative inline-flex cursor-grab active:cursor-grabbing rounded-full",
        "transition-transform hover:scale-110",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rbx-primary",
        isDragging && "opacity-35 scale-95",
      )}
    >
      <Avatar
        firstName={student.firstName}
        lastName={student.lastName}
        score={effectiveScore}
        size="sm"
      />
      {hasOverride && (
        <span
          aria-hidden
          title="Nota individual ajustada"
          className="absolute -right-0.5 -top-0.5 inline-flex h-3 w-3 items-center justify-center rounded-full bg-rbx-accent ring-2 ring-white"
        />
      )}
    </div>
  );
}
