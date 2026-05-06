"use client";

import { useEffect, useState } from "react";
import { CLASS_ID, SESSION_ID } from "@/lib/constants";
import { listStudentsByClass } from "@/lib/data/students";
import { listGroupsBySession } from "@/lib/data/groups";
import { listMembersByGroupIds } from "@/lib/data/group-members";
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

export default function HomePage() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [students, groups] = await Promise.all([
          listStudentsByClass(CLASS_ID),
          listGroupsBySession(SESSION_ID),
        ]);
        const members = await listMembersByGroupIds(groups.map((g) => g.id));
        if (!cancelled) setState({ status: "ok", data: { students, groups, members } });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (!cancelled) setState({ status: "error", message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return <Centered>Cargando datos…</Centered>;
  }
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
  const assignedIds = new Set(
    members.map((m) => m.student_id).filter((id): id is string => id !== null),
  );
  const unassigned = students.filter((s) => !assignedIds.has(s.id));

  const studentsById = new Map(students.map((s) => [s.id, s]));
  const groupsWithMembers = groups.map((g) => ({
    group: g,
    members: members
      .filter((m) => m.group_id === g.id)
      .map((m) => (m.student_id ? studentsById.get(m.student_id) : null))
      .filter((s): s is Student => s !== undefined && s !== null),
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
                  className="rounded border border-slate-200 px-2 py-1 text-sm text-slate-800"
                >
                  {s.full_name}
                  {s.performance_score !== null && (
                    <span className="ml-2 text-xs text-slate-500">
                      {s.performance_score.toFixed(1)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {groupsWithMembers.map(({ group, members }) => (
            <article
              key={group.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <h3 className="text-sm font-semibold text-slate-900">
                {group.name}{" "}
                <span className="font-normal text-slate-500">
                  ({members.length})
                </span>
              </h3>
              {members.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">Sin miembros.</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-1">
                  {members.map((s) => (
                    <li key={s.id} className="text-sm text-slate-800">
                      {s.full_name}
                      {s.performance_score !== null && (
                        <span className="ml-2 text-xs text-slate-500">
                          {s.performance_score.toFixed(1)}
                        </span>
                      )}
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

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-700">
        {children}
      </div>
    </main>
  );
}
