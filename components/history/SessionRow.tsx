"use client";

import type { HistorySession } from "@/lib/domain/types";
import { Badge } from "@/components/ui/Badge";
import { t } from "@/lib/i18n/strings";

const TONE = {
  active: "info",
  archived: "neutral",
  locked: "warning",
} as const;

function formatDate(iso: string): string {
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

export function SessionRow({ session }: { session: HistorySession }) {
  return (
    <li className="grid grid-cols-1 gap-2 rounded-xl border border-rbx-border bg-white p-4 sm:grid-cols-[2fr_1fr_auto_auto_auto] sm:items-center sm:gap-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-rbx-text-primary">
          {session.name}
        </p>
        <p className="text-xs text-rbx-text-secondary sm:hidden">
          {formatDate(session.date)}
        </p>
      </div>
      <p className="hidden text-sm text-rbx-text-secondary tabular-nums sm:block">
        {formatDate(session.date)}
      </p>
      <p className="text-sm tabular-nums text-rbx-text-secondary">
        {session.panelCount} <span className="text-xs">{t.history.column_groups.toLowerCase()}</span>
      </p>
      <p className="text-sm tabular-nums text-rbx-text-secondary">
        {session.assignedStudentCount}{" "}
        <span className="text-xs">{t.history.column_students.toLowerCase()}</span>
      </p>
      <div>
        <Badge tone={TONE[session.status]}>{t.history.status[session.status]}</Badge>
      </div>
    </li>
  );
}
