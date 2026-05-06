"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useShallow } from "zustand/react/shallow";
import { StudentRow } from "./StudentRow";
import { StudentRowDraggable } from "./StudentRowDraggable";
import { UNITS, FLAT_COLUMNS } from "@/lib/data/units";
import { usePodsStore } from "@/store/pods-store";
import { sortByLastName, displayName } from "@/lib/utils/sort-students";
import { Plus } from "lucide-react";
import { PodBadge } from "@/components/pods/PodBadge";
import { PodDroppableTbody } from "@/components/pods/PodDroppableTbody";
import { PodAddStudentButton } from "@/components/pods/PodAddStudentButton";
import { MOVE_ERROR_MESSAGES } from "@/lib/pods/move-student";
import type { StudentRow as StudentRowType } from "@/types/database";
import type { Pod } from "@/lib/pods/create-pods";

type Props = {
  students: StudentRowType[];
};

const TOTAL_COLUMNS = 1 + FLAT_COLUMNS.length;

export function StudentTable({ students }: Props) {
  const { pods, viewWithPods, sortMode } = usePodsStore(
    useShallow((s) => ({
      pods: s.pods,
      viewWithPods: s.viewWithPods,
      sortMode: s.sortMode,
    })),
  );
  const moveStudent = usePodsStore((s) => s.moveStudent);
  const addEmptyPod = usePodsStore((s) => s.addEmptyPod);

  const studentToPod = useMemo(() => {
    const map = new Map<string, Pod>();
    pods.forEach((pod) => {
      pod.students.forEach((s) => map.set(s.id, pod));
    });
    return map;
  }, [pods]);

  const studentMap = useMemo(
    () => new Map(students.map((s) => [s.id, s])),
    [students],
  );

  if (students.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        No hay alumnos en esta clase.
      </div>
    );
  }

  const isGrouped = viewWithPods && sortMode === "grouped";
  const sortedAlpha = sortByLastName(students);

  return (
    <div className="bg-white border-y border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-separate border-spacing-0">
          <TableHeader />
          {isGrouped ? (
            <DndStudentBodies
              pods={pods}
              students={students}
              studentMap={studentMap}
              studentToPod={studentToPod}
              onMove={moveStudent}
              onAddEmptyPod={addEmptyPod}
            />
          ) : (
            <tbody>
              {sortedAlpha.map((s, i) => (
                <StudentRow
                  key={s.id}
                  student={s}
                  index={i}
                  columns={FLAT_COLUMNS}
                  pod={viewWithPods ? studentToPod.get(s.id) : undefined}
                  showBadge={viewWithPods}
                  withChangeDropdown={viewWithPods}
                />
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}

function TableHeader() {
  return (
    <thead>
      <tr>
        <th
          rowSpan={2}
          scope="col"
          className="text-left font-bold text-[11px] text-slate-700 px-3 py-2 sticky left-0 z-20 bg-[#e8eef1] border-b border-slate-300 align-middle min-w-[240px]"
        >
          Alumno
        </th>
        {UNITS.map((unit) => (
          <th
            key={unit.number}
            colSpan={unit.activities.length}
            scope="colgroup"
            className="text-center font-semibold text-slate-700 px-2 py-2 bg-[#e8eef1] border-l border-slate-300 border-b border-slate-300"
          >
            <div className="text-[10px] leading-tight font-semibold text-slate-700">
              {unit.code} - Unidad {unit.number}:
            </div>
            <div className="text-[10px] leading-tight text-slate-700">
              {unit.title}
            </div>
          </th>
        ))}
      </tr>
      <tr>
        {FLAT_COLUMNS.map((c, i) => {
          const isUnitStart = i > 0 && c.activity.key.endsWith("-intro");
          return (
            <th
              key={c.activity.key}
              scope="col"
              className={`align-bottom text-left font-normal text-slate-600 px-0 py-1 bg-[#f0f4f6] border-b border-slate-300 ${
                isUnitStart ? "border-l border-slate-300" : ""
              }`}
              style={{ minWidth: 36, height: 92 }}
            >
              <div className="origin-bottom-left rotate-[-55deg] translate-x-[18px] -translate-y-1 whitespace-nowrap text-[10px] text-slate-600">
                {c.activity.label}
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

type DndBodiesProps = {
  pods: Pod[];
  students: StudentRowType[];
  studentMap: Map<string, StudentRowType>;
  studentToPod: Map<string, Pod>;
  onMove: ReturnType<typeof usePodsStore.getState>["moveStudent"];
  onAddEmptyPod: () => void;
};

function DndStudentBodies({
  pods,
  students,
  studentMap,
  studentToPod,
  onMove,
  onAddEmptyPod,
}: DndBodiesProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const unassigned = students.filter((s) => !studentToPod.has(s.id));
  const sortedUnassigned = sortByLastName(unassigned);
  const unassignedForMenu = unassigned.map((s) => ({
    id: s.id,
    full_name: s.full_name,
  }));

  function handleDragStart(e: DragStartEvent) {
    const data = e.active.data.current;
    if (data?.["type"] === "student") {
      setActiveStudentId(data["studentId"] as string);
      setFeedback(null);
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveStudentId(null);
    const fromData = e.active.data.current;
    const toData = e.over?.data.current;
    if (fromData?.["type"] !== "student" || toData?.["type"] !== "pod") return;
    const studentId = fromData["studentId"] as string;
    const toPodId = toData["podId"] as string;
    const result = onMove(studentId, toPodId);
    if (!result.ok) {
      setFeedback(MOVE_ERROR_MESSAGES[result.reason]);
      window.setTimeout(() => setFeedback(null), 2500);
    }
  }

  function handleDragCancel() {
    setActiveStudentId(null);
  }

  const activeStudent = activeStudentId
    ? studentMap.get(activeStudentId)
    : null;
  const activePod = activeStudentId ? studentToPod.get(activeStudentId) : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        accessibility={{
          announcements: {
            onDragStart({ active }) {
              return `Has agarrado al alumno ${String(active.id)}`;
            },
            onDragOver({ active, over }) {
              return over
                ? `Alumno ${String(active.id)} sobre ${String(over.id)}`
                : `Alumno ${String(active.id)} fuera de zona válida`;
            },
            onDragEnd({ active, over }) {
              return over
                ? `Soltado en ${String(over.id)}`
                : `Soltado fuera de zona, no se ha movido`;
            },
            onDragCancel({ active }) {
              return `Movimiento de ${String(active.id)} cancelado`;
            },
          },
          screenReaderInstructions: {
            draggable:
              "Pulsa Espacio para agarrar al alumno, flechas para mover entre PODs, Espacio para soltar, Escape para cancelar.",
          },
        }}
      >
        {pods.map((pod) => (
          <PodDroppableTbody key={pod.id} pod={pod}>
            <PodSectionHeaderRow pod={pod} unassigned={unassignedForMenu} />
            {pod.students.map((podStudent, i) => {
              const fullStudent = studentMap.get(podStudent.id);
              if (!fullStudent) return null;
              return (
                <StudentRowDraggable
                  key={podStudent.id}
                  student={fullStudent}
                  index={i}
                  columns={FLAT_COLUMNS}
                  pod={pod}
                />
              );
            })}
          </PodDroppableTbody>
        ))}
        <tbody>
          <tr>
            <td colSpan={TOTAL_COLUMNS} className="p-0 sticky left-0 z-10">
              <button
                type="button"
                onClick={onAddEmptyPod}
                className="w-full flex items-center justify-center gap-2 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border-y border-dashed border-slate-300 hover:border-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <Plus className="size-4" aria-hidden />
                Crear nuevo grupo
              </button>
            </td>
          </tr>
        </tbody>
        {sortedUnassigned.length > 0 && (
          <tbody>
            <tr>
              <td
                colSpan={TOTAL_COLUMNS}
                className="px-4 py-2 sticky left-0 z-10 text-xs font-semibold text-slate-700 bg-slate-100 border-t-2 border-slate-300"
              >
                Sin asignar ({sortedUnassigned.length})
              </td>
            </tr>
            {sortedUnassigned.map((s, i) => (
              <StudentRow
                key={s.id}
                student={s}
                index={i}
                columns={FLAT_COLUMNS}
                showBadge
              />
            ))}
          </tbody>
        )}
        <DragOverlay>
          {activeStudent && activePod ? (
            <DragGhost student={activeStudent} pod={activePod} />
          ) : null}
        </DragOverlay>
      </DndContext>
      {feedback && (
        <tbody>
          <tr>
            <td
              colSpan={TOTAL_COLUMNS}
              className="px-4 py-2 bg-rose-50 text-rose-800 text-xs font-medium border-t border-rose-200"
              role="alert"
            >
              {feedback}
            </td>
          </tr>
        </tbody>
      )}
    </>
  );
}

function PodSectionHeaderRow({
  pod,
  unassigned,
}: {
  pod: Pod;
  unassigned: { id: string; full_name: string }[];
}) {
  return (
    <tr>
      <td
        colSpan={TOTAL_COLUMNS}
        className="px-0 py-0 sticky left-0 z-10"
        style={{ borderTop: `2px solid ${pod.color.hex}` }}
      >
        <div
          className="flex items-center gap-3 px-4 py-2"
          style={{ backgroundColor: `${pod.color.hex}1a` }}
        >
          <PodBadge pod={pod} size="md" prefix="Grupo" />
          <span className="text-xs font-semibold text-slate-700">
            {pod.students.length} de {pod.maxCapacity} alumnos
          </span>
          <div className="ml-auto">
            <PodAddStudentButton pod={pod} unassigned={unassigned} />
          </div>
        </div>
      </td>
    </tr>
  );
}

function DragGhost({
  student,
  pod,
}: {
  student: StudentRowType;
  pod: Pod;
}) {
  return (
    <div className="rounded-md border border-slate-300 bg-white shadow-lg px-3 py-2 flex items-center gap-2">
      <PodBadge pod={pod} />
      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-800 text-[11px] font-semibold">
        {student.initials ??
          student.full_name
            .split(/\s+/)
            .map((p) => p[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase()}
      </span>
      <span className="text-[12px] font-semibold text-slate-800">
        {displayName(student.full_name)}
      </span>
    </div>
  );
}
