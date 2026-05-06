"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { StudentRow } from "./StudentRow";
import { UNITS, FLAT_COLUMNS } from "@/lib/data/units";
import { usePodsStore } from "@/store/pods-store";
import { sortByLastName } from "@/lib/utils/sort-students";
import { PodBadge } from "@/components/pods/PodBadge";
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
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-separate border-spacing-0">
          <TableHeader />
          <tbody>
            {isGrouped ? (
              <GroupedBody
                pods={pods}
                students={students}
                studentMap={studentMap}
                studentToPod={studentToPod}
              />
            ) : (
              sortedAlpha.map((s, i) => (
                <StudentRow
                  key={s.id}
                  student={s}
                  index={i}
                  columns={FLAT_COLUMNS}
                  pod={viewWithPods ? studentToPod.get(s.id) : undefined}
                  showBadge={viewWithPods}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
        <span>
          {students.length} alumno{students.length === 1 ? "" : "s"}
        </span>
        {viewWithPods && pods.length > 0 && (
          <span>
            {pods.length} POD{pods.length === 1 ? "" : "s"}
          </span>
        )}
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
          className="text-left font-semibold text-slate-600 px-4 py-2 sticky left-0 z-20 bg-slate-50 border-b-2 border-slate-200 align-bottom min-w-[320px]"
        >
          Alumno
        </th>
        {UNITS.map((unit) => (
          <th
            key={unit.number}
            colSpan={unit.activities.length}
            scope="colgroup"
            className="text-center font-semibold text-slate-700 px-3 py-2 bg-slate-50 border-l border-slate-200 border-b border-slate-200"
          >
            <div className="text-[10px] uppercase tracking-wide text-slate-400">
              {unit.code} · Unidad {unit.number}
            </div>
            <div className="text-[11px] text-slate-700 leading-snug max-w-[240px] mx-auto truncate">
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
              className={`text-center font-medium text-slate-500 px-1 py-2 bg-slate-50 border-b-2 border-slate-200 ${
                isUnitStart ? "border-l border-slate-200" : ""
              }`}
              style={{ minWidth: 56 }}
            >
              <div className="rotate-[-30deg] origin-bottom-left whitespace-nowrap text-[10px] text-slate-500 ml-2 mb-1">
                {c.activity.label}
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

function GroupedBody({
  pods,
  students,
  studentMap,
  studentToPod,
}: {
  pods: Pod[];
  students: StudentRowType[];
  studentMap: Map<string, StudentRowType>;
  studentToPod: Map<string, Pod>;
}) {
  const unassigned = students.filter((s) => !studentToPod.has(s.id));
  const sortedUnassigned = sortByLastName(unassigned);

  return (
    <>
      {pods.map((pod) => (
        <PodSection key={pod.id} pod={pod} studentMap={studentMap} />
      ))}
      {sortedUnassigned.length > 0 && (
        <>
          <SectionHeader
            label={`Sin asignar (${sortedUnassigned.length})`}
            color="#94a3b8"
          />
          {sortedUnassigned.map((s, i) => (
            <StudentRow
              key={s.id}
              student={s}
              index={i}
              columns={FLAT_COLUMNS}
              showBadge={true}
            />
          ))}
        </>
      )}
    </>
  );
}

function PodSection({
  pod,
  studentMap,
}: {
  pod: Pod;
  studentMap: Map<string, StudentRowType>;
}) {
  return (
    <>
      <tr>
        <td
          colSpan={TOTAL_COLUMNS}
          className="px-0 py-0 sticky left-0 z-10"
          style={{ borderTop: `2px solid ${pod.color.hex}` }}
        >
          <div
            className="flex items-center gap-3 px-4 py-2"
            style={{
              backgroundColor: `${pod.color.hex}1a`,
            }}
          >
            <PodBadge pod={pod} size="md" />
            <span className="text-xs font-semibold text-slate-700">
              {pod.students.length} de {pod.maxCapacity} alumnos
            </span>
          </div>
        </td>
      </tr>
      {pod.students.map((podStudent, i) => {
        const fullStudent = studentMap.get(podStudent.id);
        if (!fullStudent) return null;
        return (
          <StudentRow
            key={podStudent.id}
            student={fullStudent}
            index={i}
            columns={FLAT_COLUMNS}
            pod={pod}
            showBadge={false}
            podColorBorder={true}
          />
        );
      })}
    </>
  );
}

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <tr>
      <td
        colSpan={TOTAL_COLUMNS}
        className="px-4 py-2 sticky left-0 z-10 text-xs font-semibold text-slate-700 bg-slate-100"
        style={{ borderTop: `2px solid ${color}` }}
      >
        {label}
      </td>
    </tr>
  );
}
