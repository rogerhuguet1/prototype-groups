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
  { key: "incorporacion", label: "Mi incorporación" },
  { key: "alumnado", label: "Mi alumnado" },
  { key: "cursos", label: "Mis cursos" },
  { key: "guias", label: "Mis guías docentes" },
  { key: "soporte", label: "Mi soporte" },
  { key: "actividades", label: "Mis actividades" },
] as const;

const COURSES = ["1º A ESO", "1º B ESO", "1º C ESO"] as const;

export function Sidebar(_props: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "1º A ESO": true,
    "1º B ESO": true,
    "1º C ESO": true,
  });

  return (
    <aside className="w-[212px] shrink-0 bg-[#424242] text-slate-100 flex flex-col h-screen sticky top-0">
      <div className="px-[18px] pt-[18px] pb-[28px]">
        <div className="h-[38px] w-[104px] bg-white text-center font-serif leading-none text-[#a01822] shadow-sm">
          <div className="pt-[5px] text-[8px] font-semibold">Colegio Bilingüe</div>
          <div className="text-[11px] font-bold italic">Villa de Móstoles</div>
          <div className="pt-[2px] text-[5px] text-[#1a4d85]">
            Infantil, Primaria, Secundaria, Bachillerato
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-[18px] pb-6">
        {COURSES.map((label) => (
          <CourseSection
            key={label}
            label={label}
            expanded={expanded[label] ?? false}
            activeSub={label === "1º A ESO" ? "alumnado" : null}
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
    <div className="border-t border-[#c9c9c9] py-[11px]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-[18px] px-0 py-1 text-[14px] font-bold text-[#dce8f7] hover:text-white"
      >
        {expanded ? (
          <ChevronDown className="size-4 text-black" aria-hidden />
        ) : (
          <ChevronRight className="size-4 text-black" aria-hidden />
        )}
        <span>{label}</span>
      </button>
      {expanded && (
        <ul className="mt-[8px] space-y-[3px]">
          {SUBITEMS.map(({ key, label: subLabel }) => {
            const isActive = activeSub === key;
            return (
              <li key={key}>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className={cn(
                    "grid min-h-[38px] grid-cols-[24px_1fr] items-center gap-[14px] text-[14px] leading-tight text-white",
                    isActive ? "font-bold" : "font-medium",
                  )}
                >
                  <span className="size-[23px] rounded-full bg-[#e2ded8]" />
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
