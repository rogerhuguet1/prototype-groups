"use client";

import type { ClassRow } from "@/types/database";

type Props = {
  classes: ClassRow[];
  activeClassId: string | null;
  onSelectClass: (id: string) => void;
};

export function ClassSelector({
  classes,
  activeClassId,
  onSelectClass,
}: Props) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">Curso</span>
      <select
        value={activeClassId ?? ""}
        onChange={(e) => onSelectClass(e.target.value)}
        className="bg-blue-600 text-white border border-blue-500 rounded-md text-sm px-2 py-1.5 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white"
      >
        {classes.map((c) => (
          <option key={c.id} value={c.id} className="text-slate-900">
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
