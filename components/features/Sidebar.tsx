"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Student } from "@/lib/types";
import { StudentChip } from "./StudentChip";

interface Props {
  students: Student[];
  search: string;
  onSearchChange: (value: string) => void;
}

export function Sidebar({ students, search, onSearchChange }: Props) {
  const droppable = useDroppable({ id: "unassigned" });
  const query = search.trim().toLowerCase();
  const filtered = query
    ? students.filter((s) => s.full_name.toLowerCase().includes(query))
    : students;

  return (
    <aside
      ref={droppable.setNodeRef}
      className={[
        "flex h-full min-h-0 flex-col rounded-xl border bg-white p-3 transition-colors",
        droppable.isOver
          ? "border-emerald-300 ring-2 ring-emerald-200"
          : "border-slate-200",
      ].join(" ")}
    >
      <header className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Sin asignar</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          {students.length}
        </span>
      </header>

      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Buscar por nombre…"
        aria-label="Buscar alumnos"
        className="mb-2 w-full rounded border border-slate-200 px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-slate-300"
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {students.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-slate-500">
            Todos los alumnos están asignados.
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-slate-500">
            Sin coincidencias.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {filtered.map((s) => (
              <li key={s.id}>
                <StudentChip student={s} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
