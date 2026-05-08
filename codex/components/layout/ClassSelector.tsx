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
        className="h-[38px] rounded-full border border-slate-400 bg-white px-4 text-[14px] text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0b7fbd]"
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
