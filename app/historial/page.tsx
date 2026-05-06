"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CLASS_ID } from "@/lib/constants";
import { listArchivedSessions } from "@/lib/data/sessions";
import { listGroupsBySessionIds } from "@/lib/data/groups";
import { listMembersByGroupIds } from "@/lib/data/group-members";
import type { GroupSession } from "@/lib/types";

interface Row {
  session: GroupSession;
  groupCount: number;
  assignedCount: number;
}

type State =
  | { status: "loading" }
  | { status: "ok"; rows: Row[] }
  | { status: "error"; message: string };

const STATUS_LABEL: Record<string, string> = {
  archived: "Archivada",
  locked: "Bloqueada",
  active: "Activa",
};

const STATUS_TONE: Record<string, string> = {
  archived: "bg-slate-100 text-slate-700 border-slate-200",
  locked: "bg-sky-50 text-sky-800 border-sky-200",
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export default function HistoryPage() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sessions = await listArchivedSessions(CLASS_ID);
        const sessionIds = sessions.map((s) => s.id);
        const groups = await listGroupsBySessionIds(sessionIds);
        const members = await listMembersByGroupIds(groups.map((g) => g.id));

        const groupIdsBySession = new Map<string, Set<string>>();
        for (const g of groups) {
          if (!g.session_id) continue;
          let set = groupIdsBySession.get(g.session_id);
          if (!set) {
            set = new Set();
            groupIdsBySession.set(g.session_id, set);
          }
          set.add(g.id);
        }

        const assignedBySession = new Map<string, number>();
        for (const m of members) {
          if (!m.group_id) continue;
          for (const [sessionId, groupSet] of groupIdsBySession) {
            if (groupSet.has(m.group_id)) {
              assignedBySession.set(
                sessionId,
                (assignedBySession.get(sessionId) ?? 0) + 1,
              );
              break;
            }
          }
        }

        const rows: Row[] = sessions.map((session) => ({
          session,
          groupCount: groupIdsBySession.get(session.id)?.size ?? 0,
          assignedCount: assignedBySession.get(session.id) ?? 0,
        }));

        if (!cancelled) setState({ status: "ok", rows });
      } catch (err) {
        if (!cancelled) {
          setState({ status: "error", message: errorMessage(err) });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <header className="mx-auto mb-6 max-w-5xl">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          VisualGroups
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Historial</h1>
        <nav className="mt-1 text-xs text-slate-500">
          <Link href="/" className="hover:underline">
            Grupos
          </Link>
          <span className="mx-1">·</span>
          <span className="font-medium text-slate-700">Historial</span>
          <span className="mx-1">·</span>
          <Link href="/configuracion" className="hover:underline">
            Configuración
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-5xl">
        {state.status === "loading" && (
          <p className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-500">
            Cargando historial…
          </p>
        )}
        {state.status === "error" && (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Error: {state.message}
          </p>
        )}
        {state.status === "ok" && state.rows.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            Aún no hay sesiones guardadas. Vuelve a{" "}
            <Link href="/" className="underline">
              Grupos
            </Link>{" "}
            y pulsa "Guardar sesión".
          </p>
        )}
        {state.status === "ok" && state.rows.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Sesión</th>
                  <th className="px-4 py-2 text-left font-medium">Fecha</th>
                  <th className="px-4 py-2 text-right font-medium">Grupos</th>
                  <th className="px-4 py-2 text-right font-medium">Alumnos</th>
                  <th className="px-4 py-2 text-left font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {state.rows.map(({ session, groupCount, assignedCount }) => {
                  const status = session.status ?? "archived";
                  return (
                    <tr
                      key={session.id}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="px-4 py-2 font-medium text-slate-900">
                        {session.name}
                      </td>
                      <td className="px-4 py-2 text-slate-700 tabular-nums">
                        {formatDate(session.created_at)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-700">
                        {groupCount}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-700">
                        {assignedCount}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            "rounded-full border px-2 py-0.5 text-[11px] font-medium " +
                            (STATUS_TONE[status] ??
                              "bg-slate-100 text-slate-700 border-slate-200")
                          }
                        >
                          {STATUS_LABEL[status] ?? status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
