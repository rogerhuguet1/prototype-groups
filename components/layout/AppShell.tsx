"use client";

import { useState, useEffect } from "react";
import { CircleUser } from "lucide-react";
import { useClasses } from "@/hooks/useClasses";
import { useStudents } from "@/hooks/useStudents";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ScoreLegend } from "@/components/students/ScoreLegend";
import { StudentTable } from "@/components/students/StudentTable";
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
    <div className="min-h-screen flex flex-col bg-c360-bg">
      <header className="h-14 shrink-0 bg-c360-blue flex items-center justify-between px-4 text-white">
        <p className="text-base font-bold tracking-wide">ROBOTIX</p>
        <CircleUser className="size-7" aria-hidden />
      </header>
      <div className="flex flex-1 min-h-0">
        <Sidebar
          classes={classes}
          activeClassId={classId}
          onSelectClass={setClassId}
        />
        <main className="flex-1 flex flex-col min-w-0 bg-c360-bg">
          <PodRegroupSelectionBanner />
          <TopBar
            classes={classes}
            activeClassId={classId}
            onSelectClass={setClassId}
            students={students}
          />
          <ScoreLegend updatedAt="6/05/2026 12:00" />
          <section className="flex-1 overflow-auto">
            {classesQuery.isLoading ? (
              <div className="px-8 py-4 text-c360-text-muted text-sm">
                Cargando cursos…
              </div>
            ) : studentsQuery.isLoading ? (
              <div className="px-8 py-4 text-c360-text-muted text-sm">
                Cargando alumnos…
              </div>
            ) : studentsQuery.error ? (
              <div className="m-8 rounded-md border border-grade-fail/40 bg-grade-fail/10 p-4 text-sm text-grade-fail">
                Error al cargar alumnos:{" "}
                {(studentsQuery.error as Error).message}
              </div>
            ) : (
              <StudentTable students={students} />
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
