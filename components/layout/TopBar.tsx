"use client";

import { Download } from "lucide-react";
import { ClassSelector } from "./ClassSelector";
import { PodGroupingButton } from "@/components/pods/PodGroupingButton";
import { COURSE_LABEL, PROGRAM_LABEL } from "@/lib/data/units";
import type { ClassRow } from "@/types/database";
import type { Student } from "@/lib/pods/create-pods";

type Props = {
  classes: ClassRow[];
  activeClassId: string | null;
  onSelectClass: (id: string) => void;
  students: Student[];
};

export function TopBar({
  classes,
  activeClassId,
  onSelectClass,
  students,
}: Props) {
  return (
    <header className="bg-white">
      <div className="flex items-start justify-between gap-6 px-6 pt-5 pb-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold leading-tight text-[#0f4c5c]">
            Mi alumnado:{" "}
            <span className="font-bold">Progreso por unidad didáctica</span>
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right leading-tight">
            <p className="text-[12px] font-bold text-slate-700">
              {COURSE_LABEL}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">{PROGRAM_LABEL}</p>
          </div>
          {classes.length > 1 && (
            <ClassSelector
              classes={classes}
              activeClassId={activeClassId}
              onSelectClass={onSelectClass}
            />
          )}
          <PodGroupingButton students={students} classId={activeClassId} />
          <button
            type="button"
            className="inline-flex items-center gap-1.5 bg-[#0e7c66] hover:bg-[#0c6c58] text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-md"
          >
            <Download className="size-3.5" aria-hidden />
            Descargar
          </button>
        </div>
      </div>
    </header>
  );
}
