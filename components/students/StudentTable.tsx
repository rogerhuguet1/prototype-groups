"use client";

import { StudentRow } from "./StudentRow";
import { UNITS, FLAT_COLUMNS } from "@/lib/data/units";
import type { StudentRow as StudentRowType } from "@/types/database";

type Props = {
  students: StudentRowType[];
};

export function StudentTable({ students }: Props) {
  if (students.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        No hay alumnos en esta clase.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-separate border-spacing-0">
          <thead>
            <tr>
              <th
                rowSpan={2}
                scope="col"
                className="text-left font-semibold text-slate-600 px-4 py-2 sticky left-0 z-20 bg-slate-50 border-b-2 border-slate-200 align-bottom min-w-[280px]"
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
          <tbody>
            {students.map((s, i) => (
              <StudentRow
                key={s.id}
                student={s}
                index={i}
                columns={FLAT_COLUMNS}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
        {students.length} alumno{students.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}
