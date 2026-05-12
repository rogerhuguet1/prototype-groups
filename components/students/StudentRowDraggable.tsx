"use client";

import { useDraggable } from "@dnd-kit/core";
import { Lock, Unlock } from "lucide-react";
import { StudentRow } from "./StudentRow";
import { DragHandle } from "./DragHandle";
import { usePodsStore } from "@/store/pods-store";
import { cn } from "@/lib/utils/cn";
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
  const isLocked = usePodsStore((s) =>
    s.lockedStudentIds.includes(student.id),
  );
  const toggleStudentLock = usePodsStore((s) => s.toggleStudentLock);

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
      onRemoveFromPod={onRemoveFromPod}
      dragHandle={
        <span className="inline-flex items-center gap-0.5">
          {pod && (
            <button
              type="button"
              onClick={() => toggleStudentLock(student.id)}
              title={
                isLocked
                  ? `Desbloquear a ${student.full_name}`
                  : `Bloquear a ${student.full_name} para que no se reagrupe`
              }
              aria-label={
                isLocked
                  ? `Desbloquear a ${student.full_name}`
                  : `Bloquear a ${student.full_name}`
              }
              aria-pressed={isLocked}
              style={
                isLocked
                  ? {
                      backgroundColor: pod.color.hex,
                      color:
                        pod.color.textOn === "white" ? "#ffffff" : "#0f172a",
                    }
                  : { color: pod.color.hex }
              }
              className={cn(
                "size-6 inline-flex items-center justify-center rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
                !isLocked && "hover:bg-slate-100",
              )}
            >
              {isLocked ? (
                <Lock className="size-3.5" aria-hidden />
              ) : (
                <Unlock className="size-3.5 opacity-50" aria-hidden />
              )}
            </button>
          )}
          <DragHandle
            label={
              pod
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
