"use client";

import { ClassSelector } from "./ClassSelector";
import { PodRegroupButton } from "@/components/pods/PodRegroupButton";
import { PodHistoryButton } from "@/components/pods/PodHistoryButton";
import { PodProjectionButton } from "@/components/pods/PodProjectionButton";
import { PodCreateGroupsButton } from "@/components/pods/PodCreateGroupsButton";
import { PodEvaluateButton } from "@/components/pods/PodEvaluateButton";
import { PodSaveSnapshotButton } from "@/components/pods/PodSaveSnapshotButton";
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
    <header className="bg-c360-bg border-b border-c360-divider">
      <div className="flex items-start justify-between gap-6 px-8 pt-6 pb-4">
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-c360-text">
            Mi alumnado: Progreso por unidad didáctica
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right leading-tight">
            <p className="text-sm font-medium text-c360-text">
              {COURSE_LABEL}
            </p>
            <p className="text-xs text-c360-text-muted mt-0.5">
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
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 px-8 pb-4">
        <PodCreateGroupsButton students={students} classId={activeClassId} />
        <PodRegroupButton />
        <PodSaveSnapshotButton />
        <PodEvaluateButton />
        <PodProjectionButton />
        <PodHistoryButton />
        <button
          type="button"
          className="bg-c360-blue hover:bg-c360-blue-dark text-white text-sm font-bold uppercase tracking-wider px-6 py-2.5 rounded-full transition-colors"
        >
          Descargar
        </button>
      </div>
    </header>
  );
}
