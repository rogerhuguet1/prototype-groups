"use client";

import { useEffect, useState } from "react";
import type {
  Evaluation,
  EvaluationStatus,
  Group,
  Student,
} from "@/lib/types";
import { Button } from "@/components/ui/Button";

const ALLOWED_TRANSITIONS: Record<EvaluationStatus, EvaluationStatus[]> = {
  pending: ["draft"],
  draft: ["pending", "published"],
  published: ["draft", "locked"],
  locked: [],
};

const TRANSITION_LABEL: Record<EvaluationStatus, string> = {
  pending: "Marcar pendiente",
  draft: "Pasar a borrador",
  published: "Publicar",
  locked: "Bloquear",
};

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
  mutating: boolean;
  onRename: () => void;
  onDelete: () => void;
  onSetGroupScore: (value: number | null) => void;
  onSetOverride: (studentId: string, value: number | null) => void;
  onChangeStatus: (next: EvaluationStatus) => void;
  onUnassign: (studentId: string) => void;
}

export function DetailPanel({
  group,
  members,
  evaluation,
  overrides,
  maxGroupSize,
  mutating,
  onRename,
  onDelete,
  onSetGroupScore,
  onSetOverride,
  onChangeStatus,
  onUnassign,
}: Props) {
  const status = asStatus(evaluation?.status);
  const locked = status === "locked";
  const allowed = ALLOWED_TRANSITIONS[status];

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white">
      <header className="flex items-start justify-between gap-2 border-b border-slate-200 p-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Detalle del grupo
          </p>
          <h2 className="truncate text-lg font-semibold text-slate-900">
            {group.name}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className={[
                "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                STATUS_TONE[status],
              ].join(" ")}
            >
              {STATUS_LABEL[status]}
            </span>
            <span className="text-xs text-slate-500">
              {members.length}/{maxGroupSize}
            </span>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <section className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="detail-group-score"
              className="text-xs font-medium text-slate-700"
            >
              Nota grupal
            </label>
            <ScoreInput
              id="detail-group-score"
              value={evaluation?.group_score ?? null}
              disabled={mutating || locked}
              onCommit={onSetGroupScore}
              ariaLabel={`Nota grupal de ${group.name}`}
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {allowed.map((next) => (
              <Button
                key={next}
                size="sm"
                variant={
                  next === "published"
                    ? "success"
                    : next === "locked"
                      ? "primary"
                      : "secondary"
                }
                disabled={mutating || !evaluation}
                onClick={() => evaluation && onChangeStatus(next)}
                title={
                  !evaluation
                    ? "Asigna una nota grupal primero para crear la evaluación"
                    : undefined
                }
              >
                {TRANSITION_LABEL[next]}
              </Button>
            ))}
            {allowed.length === 0 && (
              <span className="text-xs text-slate-500">
                Estado terminal — solo lectura.
              </span>
            )}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Miembros
          </h3>
          {members.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
              Arrastra alumnos aquí.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {members.map((s) => {
                const override = overrides?.get(s.id);
                const effective = override ?? evaluation?.group_score ?? null;
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-800">
                        {s.full_name}
                      </p>
                      {effective !== null && (
                        <p className="text-[11px] text-slate-500 tabular-nums">
                          {effective.toFixed(1)}
                          {override !== undefined && (
                            <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] text-amber-800">
                              ajustada
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <ScoreInput
                        value={override ?? null}
                        disabled={mutating || locked}
                        onCommit={(v) => onSetOverride(s.id, v)}
                        ariaLabel={`Nota individual de ${s.full_name}`}
                      />
                      {override !== undefined && (
                        <button
                          type="button"
                          onClick={() => onSetOverride(s.id, null)}
                          disabled={mutating || locked}
                          aria-label={`Restaurar nota grupal para ${s.full_name}`}
                          title="Restaurar nota grupal"
                          className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                        >
                          ↺
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onUnassign(s.id)}
                        disabled={mutating || locked}
                        aria-label={`Devolver ${s.full_name} a sin asignar`}
                        title="Devolver a sin asignar"
                        className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        ←
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-slate-200 p-3">
        <Button
          size="sm"
          variant="secondary"
          onClick={onRename}
          disabled={mutating || locked}
        >
          Renombrar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          disabled={mutating || locked}
          className="text-rose-600 hover:bg-rose-50"
        >
          Eliminar grupo
        </Button>
      </footer>
    </aside>
  );
}

interface ScoreInputProps {
  value: number | null;
  onCommit: (v: number | null) => void;
  disabled?: boolean;
  ariaLabel: string;
  id?: string;
}

function ScoreInput({
  value,
  onCommit,
  disabled,
  ariaLabel,
  id,
}: ScoreInputProps) {
  const [draft, setDraft] = useState(value === null ? "" : String(value));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setDraft(value === null ? "" : String(value));
    setInvalid(false);
  }, [value]);

  function commit() {
    const trimmed = draft.trim().replace(",", ".");
    if (trimmed === "") {
      setInvalid(false);
      if (value !== null) onCommit(null);
      return;
    }
    const n = Number(trimmed);
    if (Number.isNaN(n) || n < 0 || n > 10) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    const rounded = Math.round(n * 100) / 100;
    if (rounded !== value) onCommit(rounded);
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      value={draft}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        } else if (e.key === "Escape") {
          setDraft(value === null ? "" : String(value));
          setInvalid(false);
          e.currentTarget.blur();
        }
      }}
      aria-label={ariaLabel}
      aria-invalid={invalid}
      placeholder="—"
      className={[
        "w-14 rounded border px-1.5 py-0.5 text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-40",
        invalid
          ? "border-rose-400 bg-rose-50"
          : "border-slate-200 bg-white",
      ].join(" ")}
    />
  );
}
