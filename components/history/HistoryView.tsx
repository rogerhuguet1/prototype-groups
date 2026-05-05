"use client";

import { useGroupingStore } from "@/lib/store/use-grouping-store";
import { SessionRow } from "./SessionRow";
import { t } from "@/lib/i18n/strings";

export function HistoryView() {
  const history = useGroupingStore((s) => s.history);

  return (
    <section className="mx-auto w-full max-w-4xl space-y-4">
      <header>
        <h2 className="text-xl font-semibold text-rbx-text-primary">
          {t.history.title}
        </h2>
        <p className="mt-1 text-sm text-rbx-text-secondary">
          Sesiones simuladas guardadas en este prototipo. Sin persistencia real.
        </p>
      </header>
      {history.length === 0 ? (
        <p className="rounded-xl border border-dashed border-rbx-border bg-white p-8 text-center text-sm text-rbx-text-secondary">
          {t.history.empty}
        </p>
      ) : (
        <ul role="list" className="flex flex-col gap-2">
          {history.map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </ul>
      )}
    </section>
  );
}
