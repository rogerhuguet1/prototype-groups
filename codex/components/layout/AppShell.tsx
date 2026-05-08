"use client";

import { useEffect, useState } from "react";
import { useClasses } from "@/hooks/useClasses";
import { useStudents } from "@/hooks/useStudents";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ScoreLegend } from "@/components/students/ScoreLegend";
import { StudentTable } from "@/components/students/StudentTable";
import { PodControls } from "@/components/pods/PodControls";
import { PodRegroupSelectionBanner } from "@/components/pods/PodRegroupSelectionBanner";

export function AppShell() {
  const classesQuery = useClasses();
  const [classId, setClassId] = useState<string | null>(null);

  useEffect(() => {
    const list = classesQuery.data;
    if (!list || list.length === 0) return;
    const first = list[0];
    if (!first) return;
    setClassId((prev) => prev ?? first.id);
  }, [classesQuery.data]);

  const studentsQuery = useStudents(classId);
  const classes = classesQuery.data ?? [];
  const students = studentsQuery.data ?? [];

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar
        classes={classes}
        activeClassId={classId}
        onSelectClass={setClassId}
      />
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <div className="h-[62px] shrink-0 bg-[#0b7fbd] flex items-center justify-end px-7">
          <button
            type="button"
            className="flex items-center gap-2 text-white"
            aria-label="Menu de usuario"
          >
            <span className="grid size-8 place-items-center rounded-full bg-slate-100 text-[13px] font-semibold text-slate-700">
              TR
            </span>
            <span className="text-sm leading-none">⌄</span>
          </button>
        </div>
        <PodRegroupSelectionBanner />
        <TopBar
          classes={classes}
          activeClassId={classId}
          onSelectClass={setClassId}
          students={students}
        />
        <ScoreLegend updatedAt="6/05/2026" />
        <PodControls />
        <section className="flex-1 overflow-y-auto overflow-x-hidden px-[20px] pb-8">
          {classesQuery.isLoading ? (
            <div className="px-6 py-4 text-sm text-slate-500">
              Cargando cursos...
            </div>
          ) : studentsQuery.isLoading ? (
            <div className="px-6 py-4 text-sm text-slate-500">
              Cargando alumnos...
            </div>
          ) : studentsQuery.error ? (
            <div className="m-6 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              Error al cargar alumnos: {(studentsQuery.error as Error).message}
            </div>
          ) : (
            <StudentTable students={students} />
          )}
        </section>
      </main>
    </div>
  );
}
