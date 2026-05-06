"use client";

import { useCallback, useEffect, useState } from "react";
import { CLASS_ID, SESSION_ID } from "@/lib/constants";
import { listStudentsByClass } from "@/lib/data/students";
import { listGroupsBySession } from "@/lib/data/groups";
import {
  assignStudentToGroup,
  listMembersByGroupIds,
  unassignStudent,
} from "@/lib/data/group-members";
import type { Group, GroupMember, Student } from "@/lib/types";

interface Data {
  students: Student[];
  groups: Group[];
  members: GroupMember[];
}

type State =
  | { status: "loading" }
  | { status: "ok"; data: Data }
  | { status: "error"; message: string };

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export default function HomePage() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [mutating, setMutating] = useState(false);
  const [mutError, setMutError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [students, groups] = await Promise.all([
        listStudentsByClass(CLASS_ID),
        listGroupsBySession(SESSION_ID),
      ]);
      const members = await listMembersByGroupIds(groups.map((g) => g.id));
      setState({ status: "ok", data: { students, groups, members } });
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

  const { students, groups, members } = state.data;
  const groupIds = groups.map((g) => g.id);

  async function reloadMembers() {
    try {
      const fresh = await listMembersByGroupIds(groupIds);
      setState((prev) =>
        prev.status === "ok"
          ? { status: "ok", data: { ...prev.data, members: fresh } }
          : prev,
      );
    } catch (err) {
      setMutError(errorMessage(err));
    }
  }

  async function assign(studentId: string, groupId: string) {
    setMutating(true);
    setMutError(null);
    try {
      await assignStudentToGroup(studentId, groupId, groupIds);
      await reloadMembers();
    } catch (err) {
      setMutError(errorMessage(err));
    } finally {
      setMutating(false);
    }
  }

  async function unassign(studentId: string) {
    setMutating(true);
    setMutError(null);
    try {
      await unassignStudent(studentId, groupIds);
      await reloadMembers();
    } catch (err) {
      setMutError(errorMessage(err));
    } finally {
      setMutating(false);
    }
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
        <h1 className="text-2xl font-semibold text-slate-900">Grupos</h1>
        <p className="text-sm text-slate-600">
          {students.length} alumnos · {groups.length} grupos · {members.length}{" "}
          asignaciones
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
                    disabled={mutating}
                    onPick={(groupId) => assign(s.id, groupId)}
                  />
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {groupsWithMembers.map(({ group, members: gms }) => (
            <article
              key={group.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <h3 className="text-sm font-semibold text-slate-900">
                {group.name}{" "}
                <span className="font-normal text-slate-500">({gms.length})</span>
              </h3>
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
