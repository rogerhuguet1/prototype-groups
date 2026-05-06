"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { ClassRow } from "@/types/database";

type Props = {
  classes: ClassRow[];
  activeClassId: string | null;
  onSelectClass: (id: string) => void;
};

const SUBITEMS = [
  { key: "alumnado", label: "Mi alumnado" },
  { key: "cursos", label: "Mis cursos" },
  { key: "sesiones", label: "Mis sesiones docentes" },
  { key: "reporte", label: "Mi reporte" },
  { key: "soporte", label: "Mi soporte" },
] as const;

const COURSES = ["1º ESO", "2º ESO", "3º ESO"] as const;

export function Sidebar(_props: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "1º ESO": true,
    "2º ESO": true,
    "3º ESO": true,
  });

  return (
    <aside className="w-56 shrink-0 bg-[#1f2937] text-slate-100 flex flex-col">
      <div className="px-4 py-4 border-b border-white/10">
        <p className="text-sm font-bold tracking-wider text-white">ROBOTIX</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {COURSES.map((label) => (
          <CourseSection
            key={label}
            label={label}
            expanded={expanded[label] ?? false}
            activeSub={label === "1º ESO" ? "alumnado" : null}
            onToggle={() =>
              setExpanded((prev) => ({ ...prev, [label]: !prev[label] }))
            }
          />
        ))}
      </nav>
    </aside>
  );
}

function CourseSection({
  label,
  expanded,
  activeSub,
  onToggle,
}: {
  label: string;
  expanded: boolean;
  activeSub: string | null;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/90 hover:text-white"
      >
        {expanded ? (
          <ChevronDown className="size-3" aria-hidden />
        ) : (
          <ChevronRight className="size-3" aria-hidden />
        )}
        <span>{label}</span>
      </button>
      {expanded && (
        <ul>
          {SUBITEMS.map(({ key, label: subLabel }) => {
            const isActive = activeSub === key;
            return (
              <li key={key}>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className={cn(
                    "flex items-center px-6 py-1.5 text-[12px]",
                    isActive
                      ? "bg-cyan-300/90 text-slate-900 font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5",
                  )}
                >
                  {subLabel}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
