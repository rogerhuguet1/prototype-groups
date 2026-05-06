"use client";

import { useDroppable } from "@dnd-kit/core";
import { useShallow } from "zustand/react/shallow";
import {
  selectStudentsInPanel,
  useGroupingStore,
} from "@/lib/store/use-grouping-store";
import type { EvaluationStatus, Panel } from "@/lib/domain/types";
import { PanelMemberDot } from "./PanelMemberDot";
import { Badge } from "@/components/ui/Badge";
import { EvaluationStateBadge } from "@/components/detail/EvaluationStateBadge";
import { cx } from "@/lib/utils/cx";
import {
  effectiveScore,
  formatScore,
  panelAverage,
  panelBaseAverage,
  panelRingClasses,
} from "@/lib/domain/grading";
import { t } from "@/lib/i18n/strings";

interface PanelCardProps {
  panel: Panel;
}

/** Anillo exterior según estado de evaluación (CLAUDE.md §12). */
const EVAL_RING: Record<EvaluationStatus, string> = {
  pending: "ring-0",
  draft: "ring-4 ring-rbx-warning/60",
  published: "ring-4 ring-rbx-success/70",
  locked: "ring-4 ring-rbx-info/70",
};

/**
 * Posición radial del miembro `i` de `n` dentro del círculo.
 * Coordenadas en porcentaje del contenedor (luego se centra con translate).
 */
function memberPosition(i: number, n: number): { left: string; top: string } {
  if (n <= 1) return { left: "50%", top: "30%" };
  const angle = (2 * Math.PI * i) / n - Math.PI / 2;
  const radius = n <= 4 ? 32 : 36;
  const x = 50 + radius * Math.cos(angle);
  const y = 50 + radius * Math.sin(angle);
  return { left: `${x}%`, top: `${y}%` };
}

export function PanelCard({ panel }: PanelCardProps) {
  const students = useGroupingStore(
    useShallow((s) => selectStudentsInPanel(s, panel.id)),
  );
  const evaluation = useGroupingStore((s) => s.evaluations[panel.id]);
  const selected = useGroupingStore((s) => s.selectedPanelId === panel.id);
  const select = useGroupingStore((s) => s.selectPanel);
  const minSize = useGroupingStore((s) => s.sessionConfig.minGroupSize);

  const droppable = useDroppable({ id: `panel:${panel.id}` });

  const studentIds = students.map((s) => s.id);
  const avg = panelAverage(evaluation, studentIds);
  const baseAvg = panelBaseAverage(students);
  const referenceScore = avg ?? baseAvg;
  const borderColor = panelRingClasses(referenceScore);
  const evalStatus: EvaluationStatus = evaluation?.status ?? "pending";

  const full = students.length >= panel.capacity;
  const overCapacity = droppable.isOver && full;
  const validOver = droppable.isOver && !full;
  const belowMin = students.length > 0 && students.length < minSize;
  const empty = students.length === 0;

  return (
    <article
      className={cx(
        "group relative flex flex-col items-center",
        selected && "z-10",
      )}
    >
      {/* Cabecera: nombre + capacidad */}
      <header className="flex w-full items-center justify-between gap-2 px-1 pb-2">
        <h3
          className="min-w-0 truncate text-sm font-semibold text-rbx-text-primary"
          title={panel.name}
        >
          {panel.name}
        </h3>
        <Badge tone={empty ? "neutral" : full ? "warning" : "info"}>
          {t.canvas.panel_capacity(students.length, panel.capacity)}
        </Badge>
      </header>

      {/* El círculo */}
      <button
        ref={droppable.setNodeRef}
        type="button"
        onClick={() => select(panel.id)}
        aria-pressed={selected}
        aria-label={t.a11y.select_panel(panel.name)}
        className={cx(
          "relative aspect-square w-full max-w-[280px] rounded-full border-4 bg-rbx-surface transition-all",
          "outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rbx-primary",
          borderColor,
          EVAL_RING[evalStatus],
          selected && "shadow-elev-2",
          !selected && "shadow-elev-1 hover:shadow-elev-2",
          validOver && "scale-[1.04] ring-rbx-primary",
          overCapacity && "ring-rbx-error/80 cursor-not-allowed",
        )}
      >
        {/* Empty state: + grande */}
        {empty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-rbx-text-secondary">
            <span aria-hidden className="text-5xl font-light leading-none">
              +
            </span>
            <span className="mt-2 text-xs">{t.canvas.empty_panel_drop_hint}</span>
          </div>
        )}

        {/* Centro: media efectiva */}
        {!empty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xs uppercase tracking-wide text-rbx-text-secondary">
              {t.canvas.panel_average_label}
            </p>
            <p
              className={cx(
                "text-3xl font-bold tabular-nums leading-tight",
                referenceScore === null
                  ? "text-rbx-text-secondary"
                  : "text-rbx-text-primary",
              )}
            >
              {formatScore(referenceScore)}
            </p>
            {avg === null && baseAvg !== null && (
              <p className="text-[10px] text-rbx-text-secondary">
                (orientativa)
              </p>
            )}
          </div>
        )}

        {/* Miembros distribuidos radialmente */}
        {students.map((student, i) => {
          const pos = memberPosition(i, students.length);
          const eff =
            effectiveScore(evaluation, student.id) ?? student.baseScore ?? null;
          return (
            <div
              key={student.id}
              style={{
                position: "absolute",
                left: pos.left,
                top: pos.top,
                transform: "translate(-50%, -50%)",
              }}
            >
              <PanelMemberDot
                student={student}
                effectiveScore={eff}
                hasOverride={
                  evaluation?.individualOverrides[student.id] !== undefined
                }
              />
            </div>
          );
        })}
      </button>

      {/* Pie: estado de evaluación + aviso tamaño */}
      <footer className="mt-3 flex w-full flex-wrap items-center justify-between gap-2 px-1">
        <EvaluationStateBadge status={evalStatus} compact />
        {belowMin && (
          <Badge tone="warning">
            {students.length}/{minSize} mín.
          </Badge>
        )}
        {full && !belowMin && <Badge tone="warning">{t.canvas.full_panel}</Badge>}
      </footer>
    </article>
  );
}
