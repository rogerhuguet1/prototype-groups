"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createEmptyPod,
  createPods,
  DEFAULT_MAX_PER_POD,
  type Pod,
  type Student,
} from "@/lib/pods/create-pods";
import {
  addStudentToPod as addStudentLogic,
  moveStudent as moveStudentLogic,
  removeStudentFromPod as removeStudentLogic,
  type MoveStudentResult,
} from "@/lib/pods/move-student";
import {
  changePodEmoji as changeEmojiLogic,
  type ChangeEmojiResult,
} from "@/lib/pods/edit-pod";

export type SortMode = "alphabetical" | "grouped";

export type LastInputs = {
  students: Student[];
  presentCount: number;
  robotCount: number;
};

type State = {
  pods: Pod[];
  lockedStudentIds: string[];
  sortMode: SortMode;
  sortModeBeforeSelection: SortMode | null;
  regroupSelecting: boolean;
  currentSeed: string | null;
  currentClassId: string | null;
  lastInputs: LastInputs | null;
  currentEntryId: string | null;
};

export type CreatePodsResult = {
  pods: Pod[];
  seed: string;
};

export type RegroupResult =
  | { ok: true; pods: Pod[]; seed: string }
  | { ok: false; reason: "no-previous-inputs" };

type Actions = {
  createPodsFromInput: (input: {
    students: Student[];
    presentCount: number;
    robotCount: number;
    classId: string | null;
  }) => CreatePodsResult;
  regroup: () => RegroupResult;
  resetPods: () => void;
  setSortMode: (mode: SortMode) => void;
  setCurrentEntryId: (id: string | null) => void;
  moveStudent: (studentId: string, toPodId: string) => MoveStudentResult;
  addStudentToPod: (student: Student, toPodId: string) => MoveStudentResult;
  removeStudentFromPod: (studentId: string) => MoveStudentResult;
  toggleStudentLock: (studentId: string) => void;
  enterRegroupSelection: () => void;
  exitRegroupSelection: () => void;
  clearAllLocks: () => void;
  addEmptyPod: () => void;
  createPodAndAssignStudent: (
    student: Student,
    emoji: string,
    emojiLabel: string,
  ) => void;
  changeEmoji: (
    podId: string,
    emoji: string,
    emojiLabel: string,
  ) => ChangeEmojiResult;
};

const INITIAL: State = {
  pods: [],
  lockedStudentIds: [],
  sortMode: "alphabetical",
  sortModeBeforeSelection: null,
  regroupSelecting: false,
  currentSeed: null,
  currentClassId: null,
  lastInputs: null,
  currentEntryId: null,
};

export const usePodsStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      createPodsFromInput: ({ students, presentCount, robotCount, classId }) => {
        const result = createPods({ students, presentCount, robotCount });
        set({
          pods: result.pods,
          lockedStudentIds: [],
          sortMode: "alphabetical",
          currentSeed: result.seed,
          currentClassId: classId,
          lastInputs: { students, presentCount, robotCount },
        });
        return { pods: result.pods, seed: result.seed };
      },
      regroup: () => {
        const { lastInputs } = get();
        if (!lastInputs) return { ok: false, reason: "no-previous-inputs" };
        const result = createPods({
          students: lastInputs.students,
          presentCount: lastInputs.presentCount,
          robotCount: lastInputs.robotCount,
        });
        set({
          pods: result.pods,
          sortMode: "alphabetical",
          currentSeed: result.seed,
        });
        return { ok: true, pods: result.pods, seed: result.seed };
      },
      resetPods: () => set({ ...INITIAL }),
      setSortMode: (mode) => set({ sortMode: mode }),
      setCurrentEntryId: (id) => set({ currentEntryId: id }),
      moveStudent: (studentId, toPodId) => {
        const result = moveStudentLogic(get().pods, studentId, toPodId);
        if (result.ok) set({ pods: result.pods });
        return result;
      },
      addStudentToPod: (student, toPodId) => {
        const result = addStudentLogic(get().pods, student, toPodId);
        if (result.ok) set({ pods: result.pods });
        return result;
      },
      removeStudentFromPod: (studentId) => {
        const result = removeStudentLogic(get().pods, studentId);
        if (result.ok) set({ pods: result.pods });
        return result;
      },
      toggleStudentLock: (studentId) => {
        set((state) => {
          const has = state.lockedStudentIds.includes(studentId);
          return {
            lockedStudentIds: has
              ? state.lockedStudentIds.filter((id) => id !== studentId)
              : [...state.lockedStudentIds, studentId],
          };
        });
      },
      enterRegroupSelection: () => {
        set((state) => ({
          regroupSelecting: true,
          sortModeBeforeSelection: state.sortMode,
          sortMode: "grouped",
        }));
      },
      exitRegroupSelection: () => {
        set((state) => ({
          regroupSelecting: false,
          sortMode: state.sortModeBeforeSelection ?? state.sortMode,
          sortModeBeforeSelection: null,
        }));
      },
      clearAllLocks: () => {
        set((state) => ({
          lockedStudentIds: [],
          pods: state.pods.map((p) => ({ ...p, isLocked: false })),
        }));
      },
      changeEmoji: (podId, emoji, emojiLabel) => {
        const result = changeEmojiLogic(get().pods, podId, emoji, emojiLabel);
        if (result.ok) set({ pods: result.pods });
        return result;
      },
      addEmptyPod: () => {
        const state = get();
        const maxCapacity =
          state.pods[0]?.maxCapacity ?? DEFAULT_MAX_PER_POD;
        const newPod = createEmptyPod({
          existing: state.pods,
          maxCapacity,
        });
        const newPods = [...state.pods, newPod];
        set({
          pods: newPods,
          sortMode: "grouped",
          lastInputs: state.lastInputs
            ? { ...state.lastInputs, robotCount: newPods.length }
            : state.lastInputs,
        });
      },
      createPodAndAssignStudent: (student, emoji, emojiLabel) => {
        const state = get();
        const maxCapacity =
          state.pods[0]?.maxCapacity ?? DEFAULT_MAX_PER_POD;
        const newPod = createEmptyPod({
          existing: state.pods,
          maxCapacity,
          preferredEmoji: { emoji, label: emojiLabel },
        });
        const cleanedPods = state.pods.map((p) => ({
          ...p,
          students: p.students.filter((s) => s.id !== student.id),
        }));
        const podWithStudent = {
          ...newPod,
          students: [{ id: student.id, full_name: student.full_name }],
        };
        const newPods = [...cleanedPods, podWithStudent];
        set({
          pods: newPods,
          lastInputs: state.lastInputs
            ? { ...state.lastInputs, robotCount: newPods.length }
            : state.lastInputs,
        });
      },
    }),
    {
      name: "c360-pods-state",
      version: 5,
      skipHydration: true,
      partialize: (state) => ({
        pods: state.pods,
        lockedStudentIds: state.lockedStudentIds,
        currentSeed: state.currentSeed,
        currentClassId: state.currentClassId,
        lastInputs: state.lastInputs,
        currentEntryId: state.currentEntryId,
      }),
      migrate: (persistedState, version) => {
        const fresh = {
          pods: [] as Pod[],
          lockedStudentIds: [] as string[],
          currentSeed: null,
          currentClassId: null,
          lastInputs: null,
          currentEntryId: null,
        };
        if (version < 4) return fresh;
        if (version < 5) {
          const prev = (persistedState ?? fresh) as Partial<typeof fresh>;
          return {
            ...fresh,
            ...prev,
            lockedStudentIds: prev.lockedStudentIds ?? [],
          };
        }
        return (persistedState ?? fresh) as typeof fresh;
      },
    },
  ),
);
