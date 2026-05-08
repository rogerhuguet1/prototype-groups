"use client";

import { Check, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { displayName } from "@/lib/utils/sort-students";
import {
  BAND_STYLES,
  progressCellFor,
  type ProgressCell,
} from "@/lib/utils/progress-cells";
import { PodBadge } from "@/components/pods/PodBadge";
import { PodBadgeWithDropdown } from "@/components/pods/PodBadgeWithDropdown";
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
  withChangeDropdown?: boolean;
  podColorBorder?: boolean;
  rowRef?: Ref<HTMLTableRowElement>;
  dragHandle?: ReactNode;
  isDragging?: boolean;
  onRemoveFromPod?: () => void;
};

export function StudentRow({
  student,
  index,
  columns,
  pod,
  showBadge = false,
  withChangeDropdown = false,
  podColorBorder = false,
  rowRef,
  dragHandle,
  isDragging = false,
  onRemoveFromPod,
}: Props) {
  const stripe = "bg-white";
  const name = displayName(student.full_name);

  return (
    <tr
      ref={rowRef}
      className={cn("group", stripe, isDragging && "opacity-30")}
    >
      <td
        className={cn(
          "px-[6px] py-0 sticky left-0 z-10 border-b border-r border-[#dce3e8] min-w-[232px] h-9",
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
            withChangeDropdown ? (
              <PodBadgeWithDropdown
                student={{ id: student.id, full_name: student.full_name }}
                pod={pod ?? null}
              />
            ) : pod ? (
              <PodBadge pod={pod} />
            ) : (
              <span className="inline-flex items-center text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 whitespace-nowrap">
                Pendiente de asignar
              </span>
            )
          ) : null}
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="truncate text-[13px] font-normal tracking-tight text-[#006fc9] underline hover:text-blue-900"
          >
            {name}
          </a>
          {onRemoveFromPod ? (
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={onRemoveFromPod}
              aria-label={`Quitar a ${name} del grupo`}
              title="Quitar del grupo"
              className="ml-auto p-1 rounded text-slate-400 hover:text-rose-700 hover:bg-rose-50 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-rose-300 transition-opacity"
            >
              <UserMinus className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
      </td>
      {columns.map((c, i) => {
        const cell = progressCellFor(student.id, c.index);
        const isUnitStart = i > 0 && c.activity.key.endsWith("-intro");
        return (
          <td
            key={c.activity.key}
            className={cn(
              "h-9 px-1 py-[3px] text-center border-b border-r border-[#dce3e8]",
              isUnitStart && "border-l border-[#dce3e8]",
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
        className="inline-block h-6 w-full rounded-[5px] bg-[#e1e7ee]/70"
        aria-hidden
      />
    );
  }
  if (cell.kind === "completed") {
    return (
      <span
        className="inline-flex h-6 w-full items-center justify-center rounded-[5px] bg-[#dfe5eb] text-[#3d4852]"
        aria-label="Completada sin calificación"
      >
        <Check className="size-3.5" strokeWidth={3} aria-hidden />
      </span>
    );
  }
  if (cell.kind === "failed") {
    return (
      <span
        className="inline-flex h-6 w-full items-center justify-center rounded-[5px] bg-[#e51d29] text-transparent"
        aria-label="No superada"
      >
        .
      </span>
    );
  }
  const styles = BAND_STYLES[cell.band];
  return (
    <span
      className={cn(
        "inline-flex h-6 w-full items-center justify-center rounded-[5px] text-[13px] font-bold leading-none",
        styles.bg,
        styles.text,
      )}
    >
      {Math.round(cell.value)}
    </span>
  );
}
