"use client";

import { useState } from "react";
import {
  Star,
  Trash2,
  ChevronDown,
  ChevronRight,
  Upload,
  Lock,
} from "lucide-react";
import { useHistoryStore } from "@/store/history-store";
import { usePodsStore } from "@/store/pods-store";
import type {
  HistoryEntry,
  PodEvaluation,
  PodEvaluationRating,
} from "@/types/history";
import { displayName } from "@/lib/utils/sort-students";

const RATING_BG: Record<PodEvaluationRating, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-400",
  red: "bg-rose-500",
};

const RATING_LABEL: Record<PodEvaluationRating, string> = {
  green: "Bien",
  amber: "Regular",
  red: "Mal",
};

const FORMATTER = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

type Props = {
  entry: HistoryEntry;
  onLoaded: () => void;
};

function evaluationFor(
  evaluations: PodEvaluation[],
  podId: string,
): PodEvaluationRating | null {
  return evaluations.find((e) => e.podId === podId)?.rating ?? null;
}

export function PodHistoryEntry({ entry, onLoaded }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [labelDraft, setLabelDraft] = useState(entry.label ?? "");
  const toggleFavorite = useHistoryStore((s) => s.toggleFavorite);
  const deleteEntry = useHistoryStore((s) => s.deleteEntry);
  const setLabel = useHistoryStore((s) => s.setLabel);
  const loadFromHistory = usePodsStore((s) => s.loadFromHistory);
  const currentEntryId = usePodsStore((s) => s.currentEntryId);
  const setCurrentEntryId = usePodsStore((s) => s.setCurrentEntryId);

  const totalAssigned = entry.pods.reduce(
    (acc, p) => acc + p.students.length,
    0,
  );
  const date = new Date(entry.timestamp);
  const isActive = currentEntryId === entry.id;

  const onLoad = () => {
    const studentsFromSnapshot = entry.pods.flatMap((p) =>
      p.students.map((s) => ({ id: s.id, full_name: s.full_name })),
    );
    loadFromHistory({
      pods: entry.pods,
      seed: entry.seed,
      classId: entry.classId,
      presentCount: entry.presentStudents,
      robotCount: entry.robotCount,
      students: studentsFromSnapshot,
      lockedStudentIds: entry.lockedStudentIds,
      entryId: entry.id,
    });
    onLoaded();
  };

  const onDelete = () => {
    if (isActive) setCurrentEntryId(null);
    deleteEntry(entry.id);
  };

  const onLabelBlur = () => {
    if (labelDraft !== (entry.label ?? "")) {
      setLabel(entry.id, labelDraft);
    }
  };

  return (
    <div
      className={`border rounded-md bg-white ${
        isActive ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"
      }`}
    >
      <div className="flex items-start gap-2 p-3">
        <button
          type="button"
          onClick={() => toggleFavorite(entry.id)}
          aria-label={
            entry.isFavorite ? "Quitar de favoritos" : "Marcar como favorito"
          }
          className="shrink-0 p-1 -m-1 text-slate-400 hover:text-amber-500"
        >
          <Star
            className={`size-4 ${entry.isFavorite ? "fill-amber-400 text-amber-500" : ""}`}
            aria-hidden
          />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-800">
              {FORMATTER.format(date)}
            </span>
            <span className="text-[11px] text-slate-500">
              {entry.pods.length} grupo{entry.pods.length === 1 ? "" : "s"} ·{" "}
              {totalAssigned} alumnos
            </span>
            {(() => {
              const lockedPods = entry.pods.filter((p) => p.isLocked).length;
              const lockedStudents = entry.lockedStudentIds.length;
              const total = lockedPods + lockedStudents;
              if (total === 0) return null;
              const parts: string[] = [];
              if (lockedPods > 0)
                parts.push(
                  `${lockedPods} grupo${lockedPods === 1 ? "" : "s"}`,
                );
              if (lockedStudents > 0)
                parts.push(
                  `${lockedStudents} alumno${lockedStudents === 1 ? "" : "s"}`,
                );
              return (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 rounded px-1.5 py-0.5"
                  title={`Bloqueados al guardar: ${parts.join(" + ")}`}
                >
                  <Lock className="size-3" aria-hidden />
                  {total}
                </span>
              );
            })()}
          </div>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            {entry.pods.map((p) => {
              const rating = evaluationFor(entry.evaluations, p.id);
              return (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1"
                  title={
                    rating
                      ? `${p.emojiLabel} — ${RATING_LABEL[rating]}`
                      : `${p.emojiLabel} — sin evaluar`
                  }
                >
                  <span className="text-[14px] leading-none">{p.emoji}</span>
                  <span
                    className={`size-2 rounded-full ${
                      rating ? RATING_BG[rating] : "bg-slate-300"
                    }`}
                    aria-hidden
                  />
                </span>
              );
            })}
          </div>
          <input
            type="text"
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            onBlur={onLabelBlur}
            placeholder="Añade una etiqueta…"
            className="mt-2 w-full text-[11px] px-2 py-1 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:border-blue-400 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex items-center gap-1 px-2 pb-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 rounded"
        >
          {expanded ? (
            <ChevronDown className="size-3.5" aria-hidden />
          ) : (
            <ChevronRight className="size-3.5" aria-hidden />
          )}
          {expanded ? "Ocultar detalle" : "Ver detalle"}
        </button>
        <button
          type="button"
          onClick={onLoad}
          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-50 rounded"
        >
          <Upload className="size-3.5" aria-hidden />
          Cargar
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Borrar entrada"
          className="ml-auto p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
        >
          <Trash2 className="size-3.5" aria-hidden />
        </button>
      </div>
      {expanded && (
        <div className="border-t border-slate-200 p-3 bg-slate-50 space-y-2">
          {entry.pods.map((p) => {
            const rating = evaluationFor(entry.evaluations, p.id);
            return (
              <div key={p.id}>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center text-[11px] font-bold tracking-wide rounded px-1.5 py-0.5"
                    style={{
                      backgroundColor: p.color.hex,
                      color: p.color.textOn === "white" ? "#fff" : "#0f172a",
                    }}
                  >
                    Grupo {p.emoji}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {p.students.length} alumnos
                  </span>
                  {rating && (
                    <span
                      className={`size-2.5 rounded-full ${RATING_BG[rating]}`}
                      aria-label={RATING_LABEL[rating]}
                      title={RATING_LABEL[rating]}
                    />
                  )}
                </div>
                <ul className="mt-1 ml-1 space-y-0.5">
                  {p.students.map((s) => (
                    <li key={s.id} className="text-[11px] text-slate-700">
                      {displayName(s.full_name)}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
