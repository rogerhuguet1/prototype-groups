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
import type {
  Group,
  GroupMember,
  GroupSession,
  Student,
} from "@/lib/types";

interface Data {
  students: Student[];
  groups: Group[];
  members: GroupMember[];
  session: GroupSession | null;
}

type State =
  | { status: "loading" }
  | { status: "ok"; data: Data }
  | { status: "error"; message: string };

const FALLBACK_MAX_GROUP_SIZE = 6;

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Reparte alumnos sin asignar entre los grupos.
 *
 * Round-robin: en cada paso, el siguiente alumno (orden alfabético) cae
 * en el grupo con menos miembros que todavía no esté lleno. Si todos los
 * grupos están llenos, los alumnos restantes cuentan como `leftover`.
 */
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
      const [students, groups, session] = await Promise.all([
        listStudentsByClass(CLASS_ID),
        listGroupsBySession(SESSION_ID),
        getSessionById(SESSION_ID),
      ]);
      const members = await listMembersByGroupIds(groups.map((g) => g.id));
      setState({
        status: "ok",
        data: { students, groups, members, session },
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

  const { students, groups, members, session } = state.data;
  const groupIds = groups.map((g) => g.id);
  const maxGroupSize = session?.max_group_size ?? FALLBACK_MAX_GROUP_SIZE;

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
    setState((prev) =>
      prev.status === "ok"
        ? {
            status: "ok",
            data: { ...prev.data, groups: fresh, members: freshMembers },
          }
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
              {groupsWithMembers.map(({ group, members: gms }) => (
                <article
                  key={group.id}
                  className="rounded-xl border border-slate-200 bg-white p-4"
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
                        onClick={() => handleRenameGroup(group.id, group.name)}
                        disabled={mutating}
                        title="Renombrar"
                        className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        ✏︎
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGroup(group.id, group.name)}
                        disabled={mutating}
                        title="Eliminar grupo"
                        className="rounded border border-rose-200 px-1.5 py-0.5 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                      >
                        ✕
                      </button>
                    </div>
                  </header>

                  {gms.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-500">Sin miembros.</p>
                  ) : (
                    <ul className="mt-2 flex flex-col gap-1">
                      {gms.map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <span className="truncate text-slate-800">
                            {s.full_name}
                            {s.performance_score !== null && (
                              <span className="ml-2 text-xs text-slate-500">
                                {s.performance_score.toFixed(1)}
                              </span>
                            )}
                          </span>
                          <div className="flex shrink-0 items-center gap-1">
                            <GroupSelect
                              groups={groups}
                              excludeId={group.id}
                              disabled={mutating}
                              label="Mover…"
                              onPick={(groupId) => assign(s.id, groupId)}
                            />
                            <button
                              type="button"
                              onClick={() => unassign(s.id)}
                              disabled={mutating}
                              title="Devolver a sin asignar"
                              className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                            >
                              ←
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
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

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-700">
        {children}
      </div>
    </main>
  );
}
