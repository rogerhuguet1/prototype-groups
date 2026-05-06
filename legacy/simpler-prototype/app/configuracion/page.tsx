"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SESSION_ID } from "@/lib/constants";
import {
  getSessionById,
  updateSessionConfig,
} from "@/lib/data/sessions";
import type { GroupSession } from "@/lib/types";

const HARD_MIN = 1;
const HARD_MAX = 30;

type State =
  | { status: "loading" }
  | { status: "ok"; session: GroupSession }
  | { status: "missing" }
  | { status: "error"; message: string };

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export default function ConfigPage() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [name, setName] = useState("");
  const [minSize, setMinSize] = useState(2);
  const [maxSize, setMaxSize] = useState(6);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<
    { kind: "ok" | "err"; message: string } | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await getSessionById(SESSION_ID);
        if (cancelled) return;
        if (!session) {
          setState({ status: "missing" });
          return;
        }
        setState({ status: "ok", session });
        setName(session.name);
        setMinSize(session.min_group_size ?? 2);
        setMaxSize(session.max_group_size ?? 6);
      } catch (err) {
        if (!cancelled) setState({ status: "error", message: errorMessage(err) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function validate(): string | null {
    if (!name.trim()) return "El nombre no puede estar vacío.";
    if (!Number.isFinite(minSize) || !Number.isFinite(maxSize))
      return "Los tamaños deben ser números.";
    if (minSize < HARD_MIN) return `Tamaño mínimo: ${HARD_MIN}.`;
    if (maxSize > HARD_MAX) return `Tamaño máximo: ${HARD_MAX}.`;
    if (minSize > maxSize) return "El mínimo no puede superar al máximo.";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setFeedback({ kind: "err", message: err });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      await updateSessionConfig(SESSION_ID, {
        name,
        min_group_size: Math.round(minSize),
        max_group_size: Math.round(maxSize),
      });
      const fresh = await getSessionById(SESSION_ID);
      if (fresh) setState({ status: "ok", session: fresh });
      setFeedback({ kind: "ok", message: "Configuración guardada." });
    } catch (err) {
      setFeedback({ kind: "err", message: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <header className="mx-auto mb-6 max-w-xl">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          VisualGroups
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Configuración</h1>
        <nav className="mt-1 text-xs text-slate-500">
          <Link href="/" className="hover:underline">
            Grupos
          </Link>
          <span className="mx-1">·</span>
          <Link href="/historial" className="hover:underline">
            Historial
          </Link>
          <span className="mx-1">·</span>
          <span className="font-medium text-slate-700">Configuración</span>
        </nav>
      </header>

      <div className="mx-auto max-w-xl">
        {state.status === "loading" && (
          <p className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-500">
            Cargando…
          </p>
        )}
        {state.status === "missing" && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            La sesión activa ({SESSION_ID}) no existe en Supabase.
          </p>
        )}
        {state.status === "error" && (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Error: {state.message}
          </p>
        )}
        {state.status === "ok" && (
          <form
            onSubmit={onSubmit}
            className="space-y-4 rounded-xl border border-slate-200 bg-white p-6"
          >
            <Field label="Nombre de la sesión" htmlFor="cfg-name">
              <input
                id="cfg-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
                className="w-full rounded border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-40"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Tamaño mínimo recomendado" htmlFor="cfg-min">
                <input
                  id="cfg-min"
                  type="number"
                  min={HARD_MIN}
                  max={HARD_MAX}
                  value={minSize}
                  onChange={(e) => setMinSize(Number(e.target.value))}
                  disabled={saving}
                  className="w-full rounded border border-slate-200 bg-white px-3 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-40"
                />
              </Field>
              <Field label="Tamaño máximo de grupo" htmlFor="cfg-max">
                <input
                  id="cfg-max"
                  type="number"
                  min={HARD_MIN}
                  max={HARD_MAX}
                  value={maxSize}
                  onChange={(e) => setMaxSize(Number(e.target.value))}
                  disabled={saving}
                  className="w-full rounded border border-slate-200 bg-white px-3 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-40"
                />
              </Field>
            </div>

            <p className="text-xs text-slate-500">
              El máximo se aplica a partir de ahora; los grupos que ya superen el
              nuevo máximo no se reorganizan automáticamente.
            </p>

            {feedback && (
              <p
                className={
                  "rounded-md px-3 py-2 text-sm " +
                  (feedback.kind === "ok"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700")
                }
              >
                {feedback.message}
              </p>
            )}

            <div className="flex items-center justify-end gap-2">
              <Link
                href="/"
                className="text-xs text-slate-600 hover:underline"
              >
                Volver a Grupos
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar configuración"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium text-slate-700"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
