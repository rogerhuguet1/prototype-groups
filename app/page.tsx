export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="rounded-xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          VisualGroups
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Scaffold OK
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Next 15 + React 19 + TypeScript strict + Tailwind v4. La conexión a
          Supabase llega en la Fase 3.
        </p>
      </div>
    </main>
  );
}
