"use client";

import {
  ChevronDown,
  ChevronRight,
  Users,
  BookOpen,
  CalendarDays,
  FileBarChart2,
  LifeBuoy,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { ClassRow } from "@/types/database";

type Props = {
  classes: ClassRow[];
  activeClassId: string | null;
  onSelectClass: (id: string) => void;
};

const SUBITEMS = [
  { key: "alumnado", label: "Mi alumnado", icon: Users, active: true },
  { key: "cursos", label: "Mis cursos", icon: BookOpen, active: false },
  {
    key: "sesiones",
    label: "Mis sesiones docentes",
    icon: CalendarDays,
    active: false,
  },
  { key: "reporte", label: "Mi reporte", icon: FileBarChart2, active: false },
  { key: "soporte", label: "Mi soporte", icon: LifeBuoy, active: false },
] as const;

const FAKE_COURSES = ["1º ESO", "2º ESO", "3º ESO", "4º ESO"] as const;

export function Sidebar({ classes, activeClassId, onSelectClass }: Props) {
  const [expandedFake, setExpandedFake] = useState<string | null>(null);

  return (
    <aside className="w-64 shrink-0 bg-slate-800 text-slate-100 flex flex-col">
      <div className="px-5 py-5 border-b border-slate-700">
        <p className="text-base font-bold tracking-wider text-white">
          ROBOTIX
        </p>
        <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-0.5">
          C360 · Panel docente
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {classes.map((c) => (
          <CourseSection
            key={c.id}
            label={c.name}
            expanded={true}
            active={c.id === activeClassId}
            onToggle={() => onSelectClass(c.id)}
          />
        ))}

        {FAKE_COURSES.map((label) => (
          <FakeCourseSection
            key={label}
            label={label}
            expanded={expandedFake === label}
            onToggle={() =>
              setExpandedFake((prev) => (prev === label ? null : label))
            }
          />
        ))}
      </nav>

      <div className="border-t border-slate-700 px-5 py-3 text-[11px] text-slate-400">
        Prototipo · v0.1
      </div>
    </aside>
  );
}

function CourseSection({
  label,
  expanded,
  active,
  onToggle,
}: {
  label: string;
  expanded: boolean;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider",
          active ? "text-white" : "text-slate-300 hover:text-white",
        )}
      >
        {expanded ? (
          <ChevronDown className="size-3" aria-hidden />
        ) : (
          <ChevronRight className="size-3" aria-hidden />
        )}
        <span className="truncate">{label}</span>
      </button>
      {expanded && (
        <ul className="mt-0.5">
          {SUBITEMS.map(({ key, label, icon: Icon, active: isActive }) => (
            <li key={key}>
              <span
                className={cn(
                  "flex items-center gap-2 mx-2 px-3 py-1.5 rounded-md text-sm",
                  isActive
                    ? "bg-sky-100 text-slate-900 font-medium"
                    : "text-slate-300 hover:bg-slate-700 cursor-default",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{label}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FakeCourseSection({
  label,
  expanded,
  onToggle,
}: {
  label: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200"
      >
        {expanded ? (
          <ChevronDown className="size-3" aria-hidden />
        ) : (
          <ChevronRight className="size-3" aria-hidden />
        )}
        <span>{label}</span>
      </button>
      {expanded && (
        <ul className="mt-0.5">
          {SUBITEMS.map(({ key, label, icon: Icon }) => (
            <li key={key}>
              <span className="flex items-center gap-2 mx-2 px-3 py-1.5 rounded-md text-sm text-slate-400 cursor-default">
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{label}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
