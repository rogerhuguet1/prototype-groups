"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HistoryEntry, PodEvaluation } from "@/types/history";

type State = {
  entries: HistoryEntry[];
};

type Actions = {
  addEntry: (entry: HistoryEntry) => void;
  replaceEntry: (
    id: string,
    update: Pick<
      HistoryEntry,
      | "pods"
      | "timestamp"
      | "seed"
      | "presentStudents"
      | "robotCount"
      | "lockedStudentIds"
    >,
  ) => void;
  deleteEntry: (id: string) => void;
  toggleFavorite: (id: string) => void;
  saveEvaluation: (id: string, evaluations: PodEvaluation[]) => void;
  setLabel: (id: string, label: string) => void;
  clearAll: () => void;
};

export const HISTORY_CAP = 100;

function trimToCap(entries: HistoryEntry[]): HistoryEntry[] {
  if (entries.length <= HISTORY_CAP) return entries;
  const favs = entries.filter((e) => e.isFavorite);
  const nonFavs = entries.filter((e) => !e.isFavorite);
  const slotsForNonFavs = Math.max(0, HISTORY_CAP - favs.length);
  const keptNonFavs = nonFavs.slice(0, slotsForNonFavs);
  const keepIds = new Set([...favs, ...keptNonFavs].map((e) => e.id));
  return entries.filter((e) => keepIds.has(e.id));
}

export const useHistoryStore = create<State & Actions>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => ({
          entries: trimToCap([entry, ...state.entries]),
        })),
      replaceEntry: (id, update) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, ...update } : e,
          ),
        })),
      deleteEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),
      toggleFavorite: (id) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, isFavorite: !e.isFavorite } : e,
          ),
        })),
      saveEvaluation: (id, evaluations) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id
              ? {
                  ...e,
                  evaluations,
                  evaluatedAt:
                    evaluations.length === 0 ? null : new Date().toISOString(),
                }
              : e,
          ),
        })),
      setLabel: (id, label) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, label } : e,
          ),
        })),
      clearAll: () => set({ entries: [] }),
    }),
    {
      name: "c360-pods-history",
      version: 3,
      skipHydration: true,
      migrate: (persistedState, version) => {
        if (version < 1) return { entries: [] };
        const prev = (persistedState ?? { entries: [] }) as { entries: unknown[] };
        const entries = (prev.entries ?? []).map((raw) => {
          const e = raw as HistoryEntry & { rating?: unknown };
          const { rating: _drop, ...rest } = e;
          const podsWithLock = (rest.pods ?? []).map((p) => ({
            ...p,
            isLocked: p.isLocked ?? false,
          }));
          return {
            ...rest,
            pods: podsWithLock,
            evaluations: rest.evaluations ?? [],
            evaluatedAt: rest.evaluatedAt ?? null,
            lockedStudentIds: rest.lockedStudentIds ?? [],
          };
        });
        return { entries };
      },
    },
  ),
);
