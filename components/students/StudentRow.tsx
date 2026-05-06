"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { displayName } from "@/lib/utils/sort-students";
import {
  BAND_STYLES,
  progressCellFor,
  type ProgressCell,
} from "@/lib/utils/progress-cells";
import { PodBadge } from "@/components/pods/PodBadge";
import type { FlatColumn } from "@/lib/data/units";
import type { StudentRow as StudentRowType } from "@/types/database";
import type { Pod } from "@/lib/pods/create-pods";

type Props = {
  student: StudentRowType;
  index: number;
  columns: readonly FlatColumn[];
  pod?: Pod | undefined;
  showBadge?: boolean;
  podColorBorder?: boolean;
};

export function StudentRow({
  student,
  index,
  columns,
  pod,
  showBadge = false,
  podColorBorder = false,
}: Props) {
  const stripe = index % 2 === 1 ? "bg-slate-50/60" : "bg-white";
  const name = displayName(student.full_name);
  return (
    <tr className={cn("group", stripe)}>
      <td
        className={cn(
          "px-4 py-1.5 sticky left-0 z-10 border-b border-slate-100 min-w-[320px]",
          stripe,
        )}
        style={
          podColorBorder && pod
            ? { boxShadow: `inset 4px 0 0 0 ${pod.color.hex}` }
            : undefined
        }
      >
        <div className="flex items-center gap-2">
          {showBadge ? (
            pod ? (
              <PodBadge pod={pod} />
            ) : (
              <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 whitespace-nowrap">
                Sin POD
              </span>
            )
          ) : null}
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-800 text-[11px] font-semibold">
            {student.initials ??
              student.full_name
                .split(/\s+/)
                .map((p) => p[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase()}
          </span>
          <span className="text-[12px] font-semibold tracking-tight text-slate-800 truncate">
            <a
              href="#"
              className="text-blue-700 hover:underline"
              onClick={(e) => e.preventDefault()}
            >
              {name}
            </a>
          </span>
        </div>
      </td>
      {columns.map((c, i) => {
        const cell = progressCellFor(student.id, c.index);
        const isUnitStart = i > 0 && c.activity.key.endsWith("-intro");
        return (
          <td
            key={c.activity.key}
            className={cn(
              "px-1.5 py-1.5 text-center border-b border-slate-100",
              isUnitStart && "border-l border-slate-200",
            )}
          >
            <ProgressCellView cell={cell} />
          </td>
        );
      })}
    </tr>
  );
}

function ProgressCellView({ cell }: { cell: ProgressCell }) {
  if (cell.kind === "empty") {
    return (
      <span className="inline-block size-6 rounded bg-slate-100" aria-hidden />
    );
  }
  if (cell.kind === "completed") {
    return (
      <span
        className="inline-flex size-6 items-center justify-center rounded bg-emerald-500 text-white"
        aria-label="Completada sin calificación"
      >
        <Check className="size-4" aria-hidden />
      </span>
    );
  }
  if (cell.kind === "failed") {
    return (
      <span
        className="inline-flex size-6 items-center justify-center rounded bg-rose-500 text-white"
        aria-label="No superada"
      >
        <X className="size-4" aria-hidden />
      </span>
    );
  }
  const styles = BAND_STYLES[cell.band];
  return (
    <span
      className={cn(
        "inline-flex size-6 items-center justify-center rounded text-[11px] font-bold",
        styles.bg,
        styles.text,
      )}
    >
      {cell.value.toString().replace(".", ",")}
    </span>
  );
}
