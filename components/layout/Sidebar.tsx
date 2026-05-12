"use client";

import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { ClassRow } from "@/types/database";

type Props = {
  classes: ClassRow[];
  activeClassId: string | null;
  onSelectClass: (id: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

const SUBITEMS = [
  { key: "alumnado", label: "Mi alumnado" },
  { key: "cursos", label: "Mis cursos" },
  { key: "sesiones", label: "Mis sesiones docentes" },
  { key: "reporte", label: "Mi reporte" },
  { key: "soporte", label: "Mi soporte" },
] as const;

const COURSES = ["1º ESO", "2º ESO", "3º ESO"] as const;

export function Sidebar({ collapsed, onToggleCollapsed }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "1º ESO": true,
    "2º ESO": true,
    "3º ESO": true,
  });

  return (
    <aside
      className={cn(
        "shrink-0 bg-c360-bg-muted text-c360-text border-r border-c360-divider flex flex-col transition-[width] duration-200 ease-out",
        collapsed ? "w-12" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-c360-divider px-2 py-2",
          collapsed ? "justify-center" : "justify-end",
        )}
      >
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Mostrar barra lateral" : "Ocultar barra lateral"}
          title={collapsed ? "Mostrar barra lateral" : "Ocultar barra lateral"}
          aria-expanded={!collapsed}
          className="inline-flex size-7 items-center justify-center rounded text-c360-text-muted hover:bg-c360-blue/10 hover:text-c360-blue focus:outline-none focus:ring-2 focus:ring-c360-blue"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" aria-hidden />
          ) : (
            <PanelLeftClose className="size-4" aria-hidden />
          )}
        </button>
      </div>
      {!collapsed && (
        <nav className="flex-1 overflow-y-auto py-4">
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
      )}
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
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-1.5 px-4 py-2 text-base font-bold text-c360-text hover:bg-c360-blue/5"
      >
        {expanded ? (
          <ChevronDown className="size-4" aria-hidden />
        ) : (
          <ChevronRight className="size-4" aria-hidden />
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
                    "flex items-center gap-3 pl-8 pr-4 py-2.5 text-[15px] min-h-10",
                    isActive
                      ? "font-bold text-c360-blue"
                      : "font-medium text-c360-text hover:bg-c360-blue/5",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block size-2 rounded-full",
                      isActive ? "bg-c360-blue" : "bg-c360-text-disabled/60",
                    )}
                    aria-hidden
                  />
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
