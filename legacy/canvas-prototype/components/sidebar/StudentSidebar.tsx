"use client";

import { useDroppable } from "@dnd-kit/core";
import { useShallow } from "zustand/react/shallow";
import {
  selectUnassignedStudents,
  useGroupingStore,
} from "@/lib/store/use-grouping-store";
import { StudentChip } from "./StudentChip";
import { StudentSearch } from "./StudentSearch";
import { UnassignedCounter } from "./UnassignedCounter";
import { fullName } from "@/lib/utils/initials";
import { cx } from "@/lib/utils/cx";
import { t } from "@/lib/i18n/strings";

export function StudentSidebar() {
  const allUnassigned = useGroupingStore(useShallow(selectUnassignedStudents));
  const query = useGroupingStore((s) => s.searchQuery).trim().toLowerCase();
  const filtered = query
    ? allUnassigned.filter((s) =>
        fullName(s.firstName, s.lastName).toLowerCase().includes(query),
      )
    : allUnassigned;

  const droppable = useDroppable({ id: "unassigned" });

  return (
    <aside
      className={cx(
        "flex h-full min-h-0 flex-col gap-3 rounded-xl border border-rbx-border bg-rbx-surface",
        "p-3 sm:p-4",
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-rbx-text-primary">
          {t.sidebar.title}
        </h2>
        <UnassignedCounter />
      </header>
      <StudentSearch />
      <div
        ref={droppable.setNodeRef}
        className={cx(
          "min-h-0 flex-1 overflow-y-auto rounded-lg border border-dashed transition-colors",
          droppable.isOver
            ? "border-rbx-primary bg-rbx-primary/5"
            : "border-transparent",
        )}
      >
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 py-8 text-center">
            <p className="text-sm text-rbx-text-secondary">
              {query
                ? t.sidebar.empty_search(query)
                : t.sidebar.empty_all_assigned}
            </p>
          </div>
        ) : (
          <ul role="list" className="flex flex-col gap-2 p-2">
            {filtered.map((student) => (
              <li key={student.id}>
                <StudentChip student={student} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
