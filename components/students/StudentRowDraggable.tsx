"use client";

import { useDraggable } from "@dnd-kit/core";
import { StudentRow } from "./StudentRow";
import { DragHandle } from "./DragHandle";
import { PodLockButton } from "@/components/pods/PodLockButton";
import { usePodsStore } from "@/store/pods-store";
import type { Pod } from "@/lib/pods/create-pods";
import type { StudentRow as StudentRowType } from "@/types/database";
import type { FlatColumn } from "@/lib/data/units";

type Props = {
  student: StudentRowType;
  index: number;
  columns: readonly FlatColumn[];
  pod: Pod | null;
  onRemoveFromPod?: () => void;
};

export function StudentRowDraggable({
  student,
  index,
  columns,
  pod,
  onRemoveFromPod,
}: Props) {
  const isStudentLocked = usePodsStore((s) =>
    s.lockedStudentIds.includes(student.id),
  );
  const toggleStudentLock = usePodsStore((s) => s.toggleStudentLock);
  const regroupSelecting = usePodsStore((s) => s.regroupSelecting);

  const dndDisabled = regroupSelecting;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `student:${student.id}`,
    disabled: dndDisabled,
    data: {
      type: "student",
      studentId: student.id,
      fromPodId: pod?.id ?? null,
    },
  });

  const showLockUi = regroupSelecting && pod !== null;

  const lockButton: React.ReactNode = showLockUi ? (
    <PodLockButton
      size="sm"
      locked={isStudentLocked}
      onToggle={() => toggleStudentLock(student.id)}
      label={
        isStudentLocked
          ? `Desbloquear a ${student.full_name}`
          : `Bloquear a ${student.full_name} en este grupo`
      }
      colorHex={pod!.color.hex}
    />
  ) : null;

  return (
    <StudentRow
      student={student}
      index={index}
      columns={columns}
      pod={pod ?? undefined}
      podColorBorder={Boolean(pod)}
      rowRef={setNodeRef}
      isDragging={isDragging}
      onRemoveFromPod={regroupSelecting ? undefined : onRemoveFromPod}
      dragHandle={
        <span className="inline-flex items-center gap-0.5">
          {lockButton}
          <DragHandle
            disabled={dndDisabled}
            label={
              dndDisabled
                ? `${student.full_name} no se puede arrastrar ahora`
                : pod
                  ? `Arrastrar a otro grupo: ${student.full_name}`
                  : `Arrastrar a un grupo: ${student.full_name}`
            }
            {...attributes}
            {...listeners}
          />
        </span>
      }
    />
  );
}
