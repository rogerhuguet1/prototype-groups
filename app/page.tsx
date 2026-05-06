"use client";

import { useCallback, useEffect, useState } from "react";
import { CLASS_ID, SESSION_ID } from "@/lib/constants";
import { listStudentsByClass } from "@/lib/data/students";
import {
  createGroup,
  deleteGroup,
  listGroupsBySession,
  renameGroup,
} from "@/lib/data/groups";
import {
  assignStudentToGroup,
  bulkAssignStudents,
  listMembersByGroupIds,
  unassignStudent,
} from "@/lib/data/group-members";
import { getSessionById } from "@/lib/data/sessions";
import {
  ensureEvaluation,
  listEvaluationsBySession,
  setEvaluationStatus,
  setGroupScore,
} from "@/lib/data/evaluations";
import {
  deleteIndividualOverride,
  listScoresByEvalIds,
  upsertIndividualOverride,
} from "@/lib/data/individual-scores";
import type {
  Evaluation,
  EvaluationStatus,
  Group,
  GroupMember,
  GroupSession,
  IndividualScore,
  Student,
} from "@/lib/types";

interface Data {
  students: Student[];
  groups: Group[];
  members: GroupMember[];
  session: GroupSession | null;
  evaluations: Evaluation[];
  scores: IndividualScore[];
}

type State =
  | { status: "loading" }
  | { status: "ok"; data: Data }
  | { status: "error"; message: string };

const FALLBACK_MAX_GROUP_SIZE = 6;

const ALLOWED_TRANSITIONS: Record<EvaluationStatus, EvaluationStatus[]> = {
  pending: ["draft"],
  draft: ["pending", "published"],
  published: ["draft", "locked"],
  locked: [],
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

const TRANSITION_LABEL: Record<EvaluationStatus, string> = {
  pending: "Marcar pendiente",
  draft: "Pasar a borrador",
  published: "Publicar",
  locked: "Bloquear",
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

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function planDistribution(args: {
  unassignedStudents: readonly Student[];
  groups: readonly Group[];
  currentMembers: readonly GroupMember[];
  maxGroupSize: number;
}): {
  assignments: Array<{ studentId: string; groupId: string }>;
  leftover: number;
} {
  const counts = new Map<string, number>();
  for (const g of args.groups) counts.set(g.id, 0);
  for (const m of args.currentMembers) {
    if (m.group_id && counts.has(m.group_id)) {
      counts.set(m.group_id, (counts.get(m.group_id) ?? 0) + 1);
    }
  }

  const sorted = [...args.unassignedStudents].sort((a, b) =>
    a.full_name.localeCompare(b.full_name),
  );

  const assignments: Array<{ studentId: string; groupId: string }> = [];
  let leftover = 0;

  for (const student of sorted) {
    let bestId: string | null = null;
    let bestCount = Number.POSITIVE_INFINITY;
    for (const g of args.groups) {
      const c = counts.get(g.id) ?? 0;
      if (c >= args.maxGroupSize) continue;
      if (c < bestCount) {
        bestCount = c;
        bestId = g.id;
      }
    }
    if (bestId === null) {
      leftover++;
      continue;
    }
    assignments.push({ studentId: student.id, groupId: bestId });
    counts.set(bestId, (counts.get(bestId) ?? 0) + 1);
  }

  return { assignments, leftover };
}

export default function HomePage() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [mutating, setMutating] = useState(false);
  const [mutError, setMutError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [students, groups, session, evaluations] = await Promise.all([
        listStudentsByClass(CLASS_ID),
        listGroupsBySession(SESSION_ID),
        getSessionById(SESSION_ID),
        listEvaluationsBySession(SESSION_ID),
      ]);
      const [members, scores] = await Promise.all([
        listMembersByGroupIds(groups.map((g) => g.id)),
        listScoresByEvalIds(evaluations.map((e) => e.id)),
      ]);
      setState({
        status: "ok",
        data: { students, groups, members, session, evaluations, scores },
      });
    } catch (err) {
      setState({ status: "error", message: errorMessage(err) });
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  if (state.status === "loading") return <Centered>Cargando datos…</Centered>;
  if (state.status === "error") {
    return (
      <Centered>
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          Error: {state.message}
        </p>
      </Centered>
    );
  }

  const { students, groups, members, session, evaluations, scores } = state.data;
  const groupIds = groups.map((g) => g.id);
  const maxGroupSize = session?.max_group_size ?? FALLBACK_MAX_GROUP_SIZE;

  const evaluationByGroupId = new Map<string, Evaluation>();
  for (const e of evaluations) {
    if (e.group_id) evaluationByGroupId.set(e.group_id, e);
  }

  const overridesByEvalId = new Map<string, Map<string, number>>();
  for (const s of scores) {
    if (!s.evaluation_id || !s.student_id || s.score_override === null) continue;
    let inner = overridesByEvalId.get(s.evaluation_id);
    if (!inner) {
      inner = new Map();
      overridesByEvalId.set(s.evaluation_id, inner);
    }
    inner.set(s.student_id, s.score_override);
  }

  async function reloadMembers() {
    const fresh = await listMembersByGroupIds(groupIds);
    setState((prev) =>
      prev.status === "ok"
        ? { status: "ok", data: { ...prev.data, members: fresh } }
        : prev,
    );
  }

  async function reloadGroupsAndMembers() {
    const fresh = await listGroupsBySession(SESSION_ID);
    const freshMembers = await listMembersByGroupIds(fresh.map((g) => g.id));
    const freshEvals = await listEvaluationsBySession(SESSION_ID);
    const freshScores = await listScoresByEvalIds(freshEvals.map((e) => e.id));
    setState((prev) =>
      prev.status === "ok"
        ? {
            status: "ok",
            data: {
              ...prev.data,
              groups: fresh,
              members: freshMembers,
              evaluations: freshEvals,
              scores: freshScores,
            },
          }
        : prev,
    );
  }

  async function reloadEvaluations() {
    const evs = await listEvaluationsBySession(SESSION_ID);
    const sc = await listScoresByEvalIds(evs.map((e) => e.id));
    setState((prev) =>
      prev.status === "ok"
        ? { status: "ok", data: { ...prev.data, evaluations: evs, scores: sc } }
        : prev,
    );
  }

  async function withMutation(fn: () => Promise<void>) {
    setMutating(true);
    setMutError(null);
    try {
      await fn();
    } catch (err) {
      setMutError(errorMessage(err));
    } finally {
      setMutating(false);
    }
  }

  function assign(studentId: string, groupId: string) {
    return withMutation(async () => {
      await assignStudentToGroup(studentId, groupId, groupIds);
      await reloadMembers();
    });
  }

  function unassign(studentId: string) {
    return withMutation(async () => {
      await unassignStudent(studentId, groupIds);
      await reloadMembers();
    });
  }

  function handleCreateGroup() {
    const name = window.prompt("Nombre del grupo nuevo:");
    if (!name?.trim()) return;
    return withMutation(async () => {
      await createGroup(SESSION_ID, name);
      await reloadGroupsAndMembers();
    });
  }

  function handleRenameGroup(groupId: string, current: string) {
    const name = window.prompt("Nuevo nombre:", current);
    if (!name?.trim() || name.trim() === current) return;
    return withMutation(async () => {
      await renameGroup(groupId, name);
      await reloadGroupsAndMembers();
    });
  }

  function handleDeleteGroup(groupId: string, name: string) {
    const ok = window.confirm(
      `¿Eliminar el grupo "${name}"? Sus alumnos volverán a la lista de sin asignar.`,
    );
    if (!ok) return;
    return withMutation(async () => {
      await deleteGroup(groupId);
      await reloadGroupsAndMembers();
    });
  }

  function handleDistribute() {
    if (groups.length === 0) {
      window.alert("Necesitas al menos un grupo para distribuir.");
      return;
    }
    if (unassigned.length === 0) {
      window.alert("Todos los alumnos están asignados.");
      return;
    }
    const plan = planDistribution({
      unassignedStudents: unassigned,
      groups,
      currentMembers: members,
      maxGroupSize,
    });
    if (plan.assignments.length === 0) {
      window.alert(
        `Los grupos están llenos (capacidad máx. ${maxGroupSize}).` +
          ` ${plan.leftover} alumnos no caben.`,
      );
      return;
    }
    return withMutation(async () => {
      await bulkAssignStudents(plan.assignments);
      await reloadMembers();
      if (plan.leftover > 0) {
        window.alert(
          `${plan.assignments.length} asignados.` +
            ` ${plan.leftover} alumnos no han cabido (capacidad máx. ${maxGroupSize}).`,
        );
      }
    });
  }

  function handleSetGroupScore(groupId: string, value: number | null) {
    return withMutation(async () => {
      await setGroupScore(groupId, SESSION_ID, value);
      await reloadEvaluations();
    });
  }

  function handleSetOverride(
    groupId: string,
    studentId: string,
    value: number | null,
  ) {
    return withMutation(async () => {
      const existing = evaluationByGroupId.get(groupId);
      if (value === null) {
        if (!existing) return;
        await deleteIndividualOverride(existing.id, studentId);
      } else {
        const evaluationId = existing
          ? existing.id
          : await ensureEvaluation(groupId, SESSION_ID);
        await upsertIndividualOverride(evaluationId, studentId, value);
      }
      await reloadEvaluations();
    });
  }

  function handleSetStatus(evaluationId: string, next: EvaluationStatus) {
    return withMutation(async () => {
      await setEvaluationStatus(evaluationId, next);
      await reloadEvaluations();
    });
  }

  const assignedIds = new Set(
    members.map((m) => m.student_id).filter((id): id is string => id !== null),
  );
  const unassigned = students.filter((s) => !assignedIds.has(s.id));

  const studentsById = new Map(students.map((s) => [s.id, s]));
  const groupsWithMembers = groups.map((group) => ({
    group,
    members: members
      .filter((m) => m.group_id === group.id)
      .map((m) => (m.student_id ? studentsById.get(m.student_id) : undefined))
      .filter((s): s is Student => s !== undefined),
  }));

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <header className="mx-auto mb-6 max-w-6xl">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          VisualGroups
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          {session?.name ?? "Grupos"}
        </h1>
        <p className="text-sm text-slate-600">
          {students.length} alumnos · {groups.length} grupos · {members.length}{" "}
          asignaciones · máx {maxGroupSize}/grupo
        </p>
        {mutError && (
          <p className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {mutError}
          </p>
        )}
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-[280px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Sin asignar ({unassigned.length})
          </h2>
          {unassigned.length === 0 ? (
            <p className="text-sm text-slate-500">Todos asignados.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {unassigned.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 rounded border border-slate-200 px-2 py-1 text-sm"
                >
                  <span className="truncate text-slate-800">
                    {s.full_name}
                    {s.performance_score !== null && (
                      <span className="ml-2 text-xs text-slate-500">
                        {s.performance_score.toFixed(1)}
                      </span>
                    )}
                  </span>
                  <GroupSelect
                    groups={groups}
                    disabled={mutating || groups.length === 0}
                    onPick={(groupId) => assign(s.id, groupId)}
                  />
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              {groups.length} grupos
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDistribute}
                disabled={mutating || groups.length === 0}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Distribuir
              </button>
              <button
                type="button"
                onClick={handleCreateGroup}
                disabled={mutating}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                + Crear grupo
              </button>
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              No hay grupos. Pulsa "Crear grupo" para empezar.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {groupsWithMembers.map(({ group, members: gms }) => {
                const evaluation = evaluationByGroupId.get(group.id);
                const status = asStatus(evaluation?.status);
                const locked = status === "locked";
                const overrides =
                  evaluation && overridesByEvalId.get(evaluation.id);

                return (
                  <article
                    key={group.id}
                    className="flex flex-col rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <header className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {group.name}{" "}
                        <span className="font-normal text-slate-500">
                          ({gms.length}/{maxGroupSize})
                        </span>
                      </h3>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleRenameGroup(group.id, group.name)
                          }
                          disabled={mutating || locked}
                          title="Renombrar"
                          className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                        >
                          ✏︎
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteGroup(group.id, group.name)
                          }
                          disabled={mutating || locked}
                          title="Eliminar grupo"
                          className="rounded border border-rose-200 px-1.5 py-0.5 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                        >
                          ✕
                        </button>
                      </div>
                    </header>

                    {/* Bloque evaluación */}
                    <div className="mt-2 rounded-md border border-slate-100 bg-slate-50 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={
                            "rounded-full border px-2 py-0.5 text-[11px] font-medium " +
                            STATUS_TONE[status]
                          }
                        >
                          {STATUS_LABEL[status]}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                          <label htmlFor={`gs-${group.id}`}>Nota grupal</label>
                          <ScoreInput
                            id={`gs-${group.id}`}
                            value={evaluation?.group_score ?? null}
                            disabled={mutating || locked}
                            onCommit={(v) => handleSetGroupScore(group.id, v)}
                            ariaLabel={`Nota grupal de ${group.name}`}
                          />
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {ALLOWED_TRANSITIONS[status].map((next) => (
                          <button
                            key={next}
                            type="button"
                            disabled={mutating || !evaluation}
                            onClick={() =>
                              evaluation && handleSetStatus(evaluation.id, next)
                            }
                            title={
                              !evaluation
                                ? "Asigna una nota grupal primero para crear la evaluación"
                                : undefined
                            }
                            className={
                              "rounded border px-2 py-0.5 text-[11px] font-medium disabled:opacity-40 " +
                              (next === "published"
                                ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                : next === "locked"
                                  ? "border-sky-300 text-sky-700 hover:bg-sky-50"
                                  : "border-slate-300 text-slate-700 hover:bg-slate-100")
                            }
                          >
                            {TRANSITION_LABEL[next]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Miembros */}
                    {gms.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Sin miembros.
                      </p>
                    ) : (
                      <ul className="mt-2 flex flex-col gap-1">
                        {gms.map((s) => {
                          const override = overrides?.get(s.id);
                          const effective =
                            override ?? evaluation?.group_score ?? null;
                          return (
                            <li
                              key={s.id}
                              className="flex items-center justify-between gap-2 text-sm"
                            >
                              <span className="min-w-0 flex-1 truncate text-slate-800">
                                {s.full_name}
                                {effective !== null && (
                                  <span className="ml-2 text-xs text-slate-500">
                                    {effective.toFixed(1)}
                                    {override !== undefined && (
                                      <span
                                        title="Nota individual ajustada"
                                        className="ml-1 inline-block rounded bg-amber-100 px-1 text-[10px] text-amber-800"
                                      >
                                        ajustada
                                      </span>
                                    )}
                                  </span>
                                )}
                              </span>
                              <div className="flex shrink-0 items-center gap-1">
                                <ScoreInput
                                  value={override ?? null}
                                  disabled={mutating || locked}
                                  onCommit={(v) =>
                                    handleSetOverride(group.id, s.id, v)
                                  }
                                  ariaLabel={`Nota individual de ${s.full_name}`}
                                />
                                {override !== undefined && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSetOverride(group.id, s.id, null)
                                    }
                                    disabled={mutating || locked}
                                    title="Restaurar nota grupal"
                                    className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                  >
                                    ↺
                                  </button>
                                )}
                                <GroupSelect
                                  groups={groups}
                                  excludeId={group.id}
                                  disabled={mutating || locked}
                                  label="Mover…"
                                  onPick={(groupId) => assign(s.id, groupId)}
                                />
                                <button
                                  type="button"
                                  onClick={() => unassign(s.id)}
                                  disabled={mutating || locked}
                                  title="Devolver a sin asignar"
                                  className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                >
                                  ←
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

interface GroupSelectProps {
  groups: Group[];
  excludeId?: string;
  disabled?: boolean;
  label?: string;
  onPick: (groupId: string) => void;
}

function GroupSelect({
  groups,
  excludeId,
  disabled,
  label = "Asignar…",
  onPick,
}: GroupSelectProps) {
  return (
    <select
      value=""
      disabled={disabled}
      onChange={(e) => {
        const value = e.target.value;
        if (value) onPick(value);
        e.target.value = "";
      }}
      className="rounded border border-slate-200 bg-white px-1 py-1 text-xs text-slate-700 disabled:opacity-40"
    >
      <option value="">{label}</option>
      {groups
        .filter((g) => g.id !== excludeId)
        .map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
    </select>
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
      className={
        "w-14 rounded border px-1.5 py-0.5 text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-40 " +
        (invalid
          ? "border-rose-400 bg-rose-50"
          : "border-slate-200 bg-white")
      }
    />
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-700">
        {children}
      </div>
    </main>
  );
}
