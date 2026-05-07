"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Trash2 } from "lucide-react";
import { useHistoryStore } from "@/store/history-store";
import { usePodsStore } from "@/store/pods-store";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { PodHistoryEntry } from "./PodHistoryEntry";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function PodHistoryPanel({ open, onClose }: Props) {
  const entries = useHistoryStore((s) => s.entries);
  const clearAll = useHistoryStore((s) => s.clearAll);
  const setCurrentEntryId = usePodsStore((s) => s.setCurrentEntryId);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const sorted = [...entries].sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
    return b.timestamp.localeCompare(a.timestamp);
  });

  const favCount = sorted.filter((e) => e.isFavorite).length;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/30"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-label="Historial de combinaciones"
        className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-xl flex flex-col border-l border-slate-200"
      >
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Historial</h2>
            <p className="text-[11px] text-slate-500">
              {entries.length} combinaci
              {entries.length === 1 ? "ón" : "ones"}
              {favCount > 0 ? ` · ${favCount} favorita${favCount === 1 ? "" : "s"}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar historial"
            className="p-1 text-slate-500 hover:bg-slate-100 rounded"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sorted.length === 0 ? (
            <div className="text-center text-xs text-slate-500 py-12">
              Aún no hay combinaciones guardadas. Pulsa <strong>Agrupar</strong>{" "}
              para crear la primera.
            </div>
          ) : (
            sorted.map((entry) => (
              <PodHistoryEntry
                key={entry.id}
                entry={entry}
                onLoaded={onClose}
              />
            ))
          )}
        </div>
        {entries.length > 0 && (
          <footer className="border-t border-slate-200 px-4 py-3">
            <button
              type="button"
              onClick={() => setConfirmClearOpen(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-700 hover:bg-rose-50 px-2 py-1 rounded"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Borrar todo el historial
            </button>
          </footer>
        )}
      </aside>
      <ConfirmDialog
        open={confirmClearOpen}
        title="¿Borrar todo el historial?"
        description="Se eliminarán todas las combinaciones guardadas, incluidas las favoritas. Esta acción no se puede deshacer."
        confirmLabel="Sí, borrar todo"
        cancelLabel="Cancelar"
        variant="danger"
        onCancel={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          clearAll();
          setCurrentEntryId(null);
          setConfirmClearOpen(false);
        }}
      />
    </>,
    document.body,
  );
}
