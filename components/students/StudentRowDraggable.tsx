"use client";

import { useDraggable } from "@dnd-kit/core";
import { StudentRow } from "./StudentRow";
import { DragHandle } from "./DragHandle";
import type { Pod } from "@/lib/pods/create-pods";
import type { StudentRow as StudentRowType } from "@/types/database";
import type { FlatColumn } from "@/lib/data/units";

type Props = {
  student: StudentRowType;
  index: number;
  columns: readonly FlatColumn[];
  pod: Pod | null;
};

export function StudentRowDraggable({ student, index, columns, pod }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `student:${student.id}`,
    data: {
      type: "student",
      studentId: student.id,
      fromPodId: pod?.id ?? null,
    },
  });

  return (
    <StudentRow
      student={student}
      index={index}
      columns={columns}
      pod={pod ?? undefined}
      podColorBorder={Boolean(pod)}
      rowRef={setNodeRef}
      isDragging={isDragging}
      dragHandle={
        <DragHandle
          label={
            pod
              ? `Arrastrar a otro grupo: ${student.full_name}`
              : `Arrastrar a un grupo: ${student.full_name}`
          }
          {...attributes}
          {...listeners}
        />
      }
    />
  );
}
