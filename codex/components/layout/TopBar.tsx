"use client";

import { Download } from "lucide-react";
import { ClassSelector } from "./ClassSelector";
import { PodRegroupButton } from "@/components/pods/PodRegroupButton";
import { PodHistoryButton } from "@/components/pods/PodHistoryButton";
import { PodProjectionButton } from "@/components/pods/PodProjectionButton";
import { PodCreateGroupsButton } from "@/components/pods/PodCreateGroupsButton";
import { PodEvaluateButton } from "@/components/pods/PodEvaluateButton";
import { PodSaveSnapshotButton } from "@/components/pods/PodSaveSnapshotButton";
import { COURSE_LABEL } from "@/lib/data/units";
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
      <div className="flex items-center justify-between gap-6 px-[20px] pt-[30px] pb-[24px]">
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold leading-tight text-[#24282d]">
            Mi alumnado:{" "}
            <span className="font-bold">Progreso por unidad didáctica</span>
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <p className="text-[18px] font-bold text-[#24282d]">{COURSE_LABEL}</p>
          {classes.length > 1 ? (
            <ClassSelector
              classes={classes}
              activeClassId={activeClassId}
              onSelectClass={onSelectClass}
            />
          ) : (
            <button
              type="button"
              className="h-[38px] rounded-full border border-slate-400 bg-white px-4 text-[14px] text-slate-600"
            >
              C360 SuperNova Yellow ↕
            </button>
          )}
          <PodCreateGroupsButton students={students} classId={activeClassId} />
          <PodRegroupButton />
          <PodSaveSnapshotButton />
          <PodEvaluateButton />
          <PodProjectionButton />
          <PodHistoryButton />
          <button
            type="button"
            className="inline-flex h-[33px] min-w-[186px] items-center justify-center gap-1.5 rounded-full bg-[#0b7fbd] px-4 text-[13px] font-bold uppercase text-white shadow-[3px_3px_0_rgba(0,0,0,0.18)] hover:bg-[#076fa8]"
          >
            <Download className="size-3.5" aria-hidden />
            Descargar
          </button>
        </div>
      </div>
    </header>
  );
}
