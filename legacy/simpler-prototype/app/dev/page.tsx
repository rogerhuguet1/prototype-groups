"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { CLASS_ID } from "@/lib/constants";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; count: number }
  | { status: "error"; message: string };

export default function DevPage() {
  const [state, setState] = useState<State>({ status: "idle" });

  async function ping() {
    setState({ status: "loading" });
    try {
      const supabase = getSupabaseClient();
      const { count, error } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("class_id", CLASS_ID);
      if (error) throw error;
      setState({ status: "ok", count: count ?? 0 });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ status: "error", message });
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          VisualGroups · diagnóstico
        </p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">
          Probar conexión a Supabase
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Cuenta los alumnos de la clase seed (<code className="rounded bg-slate-100 px-1 text-xs">{CLASS_ID}</code>).
        </p>

        <button
          type="button"
          onClick={ping}
          disabled={state.status === "loading"}
          className="mt-4 inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
        >
          {state.status === "loading" ? "Conectando…" : "Probar conexión"}
        </button>

        <div className="mt-4 min-h-[3rem]">
          {state.status === "idle" && (
            <p className="text-sm text-slate-500">Pulsa el botón para empezar.</p>
          )}
          {state.status === "ok" && (
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Conectado. Alumnos en la clase seed: <strong>{state.count}</strong>
            </p>
          )}
          {state.status === "error" && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
              Error: {state.message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
