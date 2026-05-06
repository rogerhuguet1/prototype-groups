"use client";

import { Download, Users } from "lucide-react";
import { ClassSelector } from "./ClassSelector";
import { COURSE_LABEL, PROGRAM_LABEL } from "@/lib/data/units";
import type { ClassRow } from "@/types/database";

type Props = {
  classes: ClassRow[];
  activeClassId: string | null;
  onSelectClass: (id: string) => void;
};

export function TopBar({ classes, activeClassId, onSelectClass }: Props) {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="flex items-start justify-between gap-6 px-8 pt-6 pb-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-800 leading-tight">
            Mi alumnado:{" "}
            <span className="text-teal-700">
              Progreso por unidad didáctica
            </span>
          </h1>
        </div>
        <div className="flex items-start gap-4 shrink-0">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-700 leading-tight">
              {COURSE_LABEL}
            </p>
            <p className="text-xs text-slate-500 leading-tight mt-0.5">
              {PROGRAM_LABEL}
            </p>
          </div>
          {classes.length > 1 && (
            <ClassSelector
              classes={classes}
              activeClassId={activeClassId}
              onSelectClass={onSelectClass}
            />
          )}
          <button
            type="button"
            disabled
            title="Disponible próximamente"
            className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-400 cursor-not-allowed text-sm font-semibold uppercase tracking-wide px-4 py-2 rounded-md border border-slate-200"
          >
            <Users className="size-4" aria-hidden />
            Agrupar
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold uppercase tracking-wide px-4 py-2 rounded-md"
          >
            <Download className="size-4" aria-hidden />
            Descargar
          </button>
        </div>
      </div>
    </header>
  );
}
