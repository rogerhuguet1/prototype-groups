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
import type { Ref, ReactNode } from "react";

type Props = {
  student: StudentRowType;
  index: number;
  columns: readonly FlatColumn[];
  pod?: Pod | undefined;
  showBadge?: boolean;
  podColorBorder?: boolean;
  rowRef?: Ref<HTMLTableRowElement>;
  dragHandle?: ReactNode;
  isDragging?: boolean;
};

export function StudentRow({
  student,
  index,
  columns,
  pod,
  showBadge = false,
  podColorBorder = false,
  rowRef,
  dragHandle,
  isDragging = false,
}: Props) {
  const stripe = index % 2 === 1 ? "bg-slate-50/60" : "bg-white";
  const name = displayName(student.full_name);

  return (
    <tr
      ref={rowRef}
      className={cn("group", stripe, isDragging && "opacity-30")}
    >
      <td
        className={cn(
          "px-3 py-1 sticky left-0 z-10 border-b border-slate-200 min-w-[240px]",
          stripe,
        )}
        style={
          podColorBorder && pod
            ? { boxShadow: `inset 4px 0 0 0 ${pod.color.hex}` }
            : undefined
        }
      >
        <div className="flex items-center gap-2">
          {dragHandle}
          {showBadge ? (
            pod ? (
              <PodBadge pod={pod} />
            ) : (
              <span className="inline-flex items-center text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 whitespace-nowrap">
                Sin grupo
              </span>
            )
          ) : null}
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="text-[12px] font-semibold text-blue-700 hover:text-blue-900 hover:underline tracking-tight truncate"
          >
            {name}
          </a>
        </div>
      </td>
      {columns.map((c, i) => {
        const cell = progressCellFor(student.id, c.index);
        const isUnitStart = i > 0 && c.activity.key.endsWith("-intro");
        return (
          <td
            key={c.activity.key}
            className={cn(
              "px-1 py-1 text-center border-b border-slate-200",
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
      <span
        className="inline-block size-5 rounded bg-slate-200/60"
        aria-hidden
      />
    );
  }
  if (cell.kind === "completed") {
    return (
      <span
        className="inline-flex size-5 items-center justify-center rounded bg-green-600 text-white"
        aria-label="Completada sin calificación"
      >
        <Check className="size-3.5" strokeWidth={3} aria-hidden />
      </span>
    );
  }
  if (cell.kind === "failed") {
    return (
      <span
        className="inline-flex size-5 items-center justify-center rounded bg-red-500 text-white"
        aria-label="No superada"
      >
        <X className="size-3.5" strokeWidth={3} aria-hidden />
      </span>
    );
  }
  const styles = BAND_STYLES[cell.band];
  return (
    <span
      className={cn(
        "inline-flex size-5 items-center justify-center rounded text-[10px] font-bold leading-none",
        styles.bg,
        styles.text,
      )}
    >
      {Math.round(cell.value)}
    </span>
  );
}
