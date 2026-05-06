"use client";

import { useEffect, useRef, useState } from "react";
import {
  selectPanelById,
  useGroupingStore,
} from "@/lib/store/use-grouping-store";
import { IconButton } from "@/components/ui/IconButton";
import { cx } from "@/lib/utils/cx";
import { t } from "@/lib/i18n/strings";
import type { Student } from "@/lib/domain/types";

/**
 * Alternativa accesible al drag & drop.
 *
 * Cualquier alumno puede asignarse / moverse / devolverse desde un menú con
 * teclado (Tab + Enter + flechas). Se apoya en las mismas acciones del store
 * que el DnD, así no hay dos lógicas paralelas.
 */
export function AssignMenu({ student }: { student: Student }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const panels = useGroupingStore((s) => s.panels);
  const memberships = useGroupingStore((s) => s.memberships);
  const assign = useGroupingStore((s) => s.assignStudent);
  const move = useGroupingStore((s) => s.moveStudent);
  const unassign = useGroupingStore((s) => s.unassignStudent);

  const currentPanelId =
    memberships.find((m) => m.studentId === student.id)?.panelId ?? null;
  const currentPanelName = useGroupingStore((s) =>
    currentPanelId ? selectPanelById(s, currentPanelId)?.name ?? null : null,
  );

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleSelect = (panelId: string) => {
    if (currentPanelId) move(student.id, panelId);
    else assign(student.id, panelId);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <IconButton
        label={t.sidebar.assign_to}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <circle cx="8" cy="3.5" r="1.3" fill="currentColor" />
          <circle cx="8" cy="8" r="1.3" fill="currentColor" />
          <circle cx="8" cy="12.5" r="1.3" fill="currentColor" />
        </svg>
      </IconButton>
      {open && (
        <div
          role="menu"
          className={cx(
            "absolute right-0 top-full z-30 mt-1 w-56 overflow-hidden rounded-lg border border-rbx-border bg-white shadow-elev-2",
          )}
        >
          <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-rbx-text-secondary">
            {t.sidebar.assign_to}
            {currentPanelName && (
              <span className="ml-1 normal-case text-rbx-text-secondary/80">
                · actual: {currentPanelName}
              </span>
            )}
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {panels.length === 0 && (
              <li className="px-3 py-2 text-sm text-rbx-text-secondary">
                Crea primero un grupo.
              </li>
            )}
            {panels.map((panel) => {
              const count = memberships.filter((m) => m.panelId === panel.id).length;
              const full = count >= panel.capacity && panel.id !== currentPanelId;
              return (
                <li key={panel.id} role="none">
                  <button
                    role="menuitem"
                    type="button"
                    disabled={full || panel.id === currentPanelId}
                    onClick={() => handleSelect(panel.id)}
                    className={cx(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm",
                      "hover:bg-rbx-surface-muted focus:bg-rbx-surface-muted focus:outline-none",
                      "disabled:cursor-not-allowed disabled:opacity-60",
                    )}
                  >
                    <span className="truncate">{panel.name}</span>
                    <span className="text-xs tabular-nums text-rbx-text-secondary">
                      {count}/{panel.capacity}
                      {full && " · lleno"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {currentPanelId && (
            <>
              <div className="h-px bg-rbx-border" />
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  unassign(student.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rbx-text-primary hover:bg-rbx-surface-muted focus:bg-rbx-surface-muted focus:outline-none"
              >
                {t.sidebar.return_button}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
