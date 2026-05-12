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
import { StudentRowDraggable } from "./StudentRowDraggable";
import { UNITS, FLAT_COLUMNS } from "@/lib/data/units";
import { usePodsStore } from "@/store/pods-store";
import { sortByLastName, displayName } from "@/lib/utils/sort-students";
import { Plus, Trash2 } from "lucide-react";
import { PodBadge } from "@/components/pods/PodBadge";
import { PodDroppableTbody } from "@/components/pods/PodDroppableTbody";
import { MOVE_ERROR_MESSAGES } from "@/lib/pods/move-student";
import { MAX_PODS } from "@/lib/pods/group-names";
import type { StudentRow as StudentRowType } from "@/types/database";
import type { Pod } from "@/lib/pods/create-pods";

type Props = {
  students: StudentRowType[];
};

const TOTAL_COLUMNS = 1 + FLAT_COLUMNS.length;

export function StudentTable({ students }: Props) {
  const pods = usePodsStore((s) => s.pods);
  const assignStudentToPod = usePodsStore((s) => s.addStudentToPod);
  const removeStudentFromPod = usePodsStore((s) => s.removeStudentFromPod);
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

  return (
    <div className="bg-white border-y border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-separate border-spacing-0">
          <TableHeader />
          <DndStudentBodies
            pods={pods}
            students={students}
            studentMap={studentMap}
            studentToPod={studentToPod}
            onAssign={assignStudentToPod}
            onRemove={removeStudentFromPod}
            onAddEmptyPod={addEmptyPod}
            canAddPod={pods.length < MAX_PODS}
          />
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
          className="text-left font-bold text-sm text-white px-4 py-3 sticky left-0 z-20 bg-c360-blue align-middle min-w-[240px] border-b-2 border-white"
        >
          Alumno
        </th>
        {UNITS.map((unit) => (
          <th
            key={unit.number}
            colSpan={unit.activities.length}
            scope="colgroup"
            className="text-center font-bold text-white px-2 py-3 bg-c360-blue border-r-2 border-white"
          >
            <div className="text-[13px] leading-tight font-bold text-white">
              {unit.code} - Unidad {unit.number}:
            </div>
            <div className="text-[13px] leading-tight font-bold text-white">
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
              className={`align-bottom text-center font-medium text-c360-text px-1 py-2 bg-white border-b border-c360-divider border-l ${
                isUnitStart ? "border-l-c360-border" : "border-l-c360-divider"
              }`}
              style={{ minWidth: 36, minHeight: 160 }}
            >
              <div
                className="mx-auto whitespace-nowrap text-[13px] font-medium text-c360-text"
                style={{
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                }}
              >
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
  onAssign: ReturnType<typeof usePodsStore.getState>["addStudentToPod"];
  onRemove: ReturnType<typeof usePodsStore.getState>["removeStudentFromPod"];
  onAddEmptyPod: () => void;
  canAddPod: boolean;
};

function DndStudentBodies({
  pods,
  students,
  studentMap,
  studentToPod,
  onAssign,
  onRemove,
  onAddEmptyPod,
  canAddPod,
}: DndBodiesProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const unassigned = students.filter((s) => !studentToPod.has(s.id));
  const sortedUnassigned = sortByLastName(unassigned);

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
    const fullStudent = studentMap.get(studentId);
    if (!fullStudent) return;
    const result = onAssign(
      { id: studentId, full_name: fullStudent.full_name },
      toPodId,
    );
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
        {pods.map((pod) => {
          const sortedMembers = sortByLastName(pod.students);
          return (
            <PodDroppableTbody key={pod.id} pod={pod}>
              <PodSectionHeaderRow pod={pod} />
              {sortedMembers.map((podStudent, i) => {
                const fullStudent = studentMap.get(podStudent.id);
                if (!fullStudent) return null;
                return (
                  <StudentRowDraggable
                    key={podStudent.id}
                    student={fullStudent}
                    index={i}
                    columns={FLAT_COLUMNS}
                    pod={pod}
                    onRemoveFromPod={() => onRemove(podStudent.id)}
                  />
                );
              })}
            </PodDroppableTbody>
          );
        })}
        <tbody>
          <tr>
            <td colSpan={TOTAL_COLUMNS} className="p-0 sticky left-0 z-10">
              <button
                type="button"
                onClick={onAddEmptyPod}
                disabled={!canAddPod}
                title={
                  canAddPod
                    ? undefined
                    : `Máximo ${MAX_PODS} grupos permitidos`
                }
                className="w-full flex items-center justify-center gap-2 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border-y border-dashed border-slate-300 hover:border-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-500"
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
                Pendientes de asignar ({sortedUnassigned.length}) — arrastra a un grupo con hueco o pulsa el desplegable
              </td>
            </tr>
            {sortedUnassigned.map((s, i) => (
              <StudentRowDraggable
                key={s.id}
                student={s}
                index={i}
                columns={FLAT_COLUMNS}
                pod={null}
                showBadge
                withChangeDropdown
              />
            ))}
          </tbody>
        )}
        <DragOverlay>
          {activeStudent ? (
            <DragGhost student={activeStudent} pod={activePod ?? null} />
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

function PodSectionHeaderRow({ pod }: { pod: Pod }) {
  const deletePod = usePodsStore((s) => s.deletePod);
  const isFull = pod.students.length >= pod.maxCapacity;
  const textColor = pod.color.textOn === "white" ? "#ffffff" : "#0f172a";

  const onDelete = () => {
    if (pod.students.length > 0) {
      const ok = window.confirm(
        `¿Eliminar el grupo ${pod.name}? Sus ${pod.students.length} alumno${pod.students.length === 1 ? "" : "s"} pasarán a "Pendientes de asignar".`,
      );
      if (!ok) return;
    }
    deletePod(pod.id);
  };

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
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-extrabold uppercase tracking-wider"
            style={{ backgroundColor: pod.color.hex, color: textColor }}
          >
            {pod.name}
          </span>
          <span className="text-xs font-semibold text-slate-700">
            {pod.students.length} de {pod.maxCapacity} alumnos
          </span>
          {isFull && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
              Lleno
            </span>
          )}
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Eliminar grupo ${pod.name}`}
            title="Eliminar grupo"
            className="ml-auto inline-flex size-7 items-center justify-center rounded text-slate-500 hover:bg-rose-100 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
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
  pod: Pod | null;
}) {
  return (
    <div className="rounded-md border border-slate-300 bg-white shadow-lg px-3 py-2 flex items-center gap-2">
      {pod ? (
        <PodBadge pod={pod} />
      ) : (
        <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 whitespace-nowrap leading-none">
          Pendiente de asignar
        </span>
      )}
      <span className="text-[12px] font-semibold text-slate-800">
        {displayName(student.full_name)}
      </span>
    </div>
  );
}
