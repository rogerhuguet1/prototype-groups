"use client";

import { useDroppable } from "@dnd-kit/core";
import type {
  Evaluation,
  EvaluationStatus,
  Group,
  Student,
} from "@/lib/types";
import { StudentChip } from "./StudentChip";

const STATUS_LABEL: Record<EvaluationStatus, string> = {
  pending: "Pendiente",
  draft: "Borrador",
  published: "Publicada",
  locked: "Bloqueada",
};

const STATUS_TONE: Record<EvaluationStatus, string> = {
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  draft: "bg-amber-50 text-amber-800 border-amber-200",
  published: "bg-emerald-50 text-emerald-800 border-emerald-200",
  locked: "bg-sky-50 text-sky-800 border-sky-200",
};

function asStatus(value: string | null | undefined): EvaluationStatus {
  if (
    value === "pending" ||
    value === "draft" ||
    value === "published" ||
    value === "locked"
  ) {
    return value;
  }
  return "pending";
}

interface Props {
  group: Group;
  members: Student[];
  evaluation: Evaluation | undefined;
  overrides: Map<string, number> | undefined;
  maxGroupSize: number;
  selected: boolean;
  onSelect: () => void;
}

export function GroupCard({
  group,
  members,
  evaluation,
  overrides,
  maxGroupSize,
  selected,
  onSelect,
}: Props) {
  const droppable = useDroppable({ id: `panel:${group.id}` });
  const status = asStatus(evaluation?.status);
  const full = members.length >= maxGroupSize;
  const validOver = droppable.isOver && !full;
  const overFull = droppable.isOver && full;

  return (
    <article
      ref={droppable.setNodeRef}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      className={[
        "flex cursor-pointer flex-col rounded-xl border bg-white p-4 transition-all",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400",
        selected
          ? "border-slate-900 ring-2 ring-slate-900/10"
          : "border-slate-200 hover:border-slate-300",
        validOver ? "border-emerald-400 ring-2 ring-emerald-200" : "",
        overFull ? "border-rose-400 ring-2 ring-rose-200" : "",
      ].join(" ")}
    >
      <header className="flex items-start justify-between gap-2">
        <h3 className="truncate text-sm font-semibold text-slate-900">
          {group.name}
        </h3>
        <span
          className={[
            "rounded-full border px-2 py-0.5 text-[11px] font-medium",
            STATUS_TONE[status],
          ].join(" ")}
        >
          {STATUS_LABEL[status]}
        </span>
      </header>

      <p className="mt-1 text-xs text-slate-500">
        {members.length}/{maxGroupSize}
        {evaluation?.group_score !== null &&
          evaluation?.group_score !== undefined && (
            <span className="ml-2 text-slate-700">
              · nota {evaluation.group_score.toFixed(1)}
            </span>
          )}
      </p>

      {members.length === 0 ? (
        <div className="mt-3 flex h-16 items-center justify-center rounded-md border border-dashed border-slate-300 text-xs text-slate-500">
          Arrastra alumnos aquí
        </div>
      ) : (
        <ul
          className="mt-3 flex flex-col gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {members.map((s) => {
            const override = overrides?.get(s.id);
            const effective = override ?? evaluation?.group_score ?? null;
            return (
              <li key={s.id}>
                <StudentChip
                  student={s}
                  effectiveScore={effective}
                  hasOverride={override !== undefined}
                />
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
