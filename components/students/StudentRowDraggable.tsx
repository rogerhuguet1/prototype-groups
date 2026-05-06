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
  pod: Pod;
};

export function StudentRowDraggable({ student, index, columns, pod }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `student:${student.id}`,
    data: {
      type: "student",
      studentId: student.id,
      fromPodId: pod.id,
    },
  });

  return (
    <StudentRow
      student={student}
      index={index}
      columns={columns}
      pod={pod}
      podColorBorder
      rowRef={setNodeRef}
      isDragging={isDragging}
      dragHandle={
        <DragHandle
          label={`Arrastrar a otro POD: ${student.full_name}`}
          {...attributes}
          {...listeners}
        />
      }
    />
  );
}
