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
  regroupConfirmNeeded: boolean;
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
  setRegroupConfirmNeeded: (value: boolean) => void;
  setCurrentEntryId: (id: string | null) => void;
  moveStudent: (studentId: string, toPodId: string) => MoveStudentResult;
  addStudentToPod: (student: Student, toPodId: string) => MoveStudentResult;
  removeStudentFromPod: (studentId: string) => MoveStudentResult;
  togglePodLock: (podId: string) => void;
  toggleStudentLock: (studentId: string) => void;
  enterRegroupSelection: () => void;
  exitRegroupSelection: () => void;
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
  loadFromHistory: (snapshot: {
    pods: Pod[];
    seed: string;
    classId: string | null;
    presentCount: number;
    robotCount: number;
    students: Student[];
    lockedStudentIds: string[];
    entryId?: string;
  }) => void;
};

const INITIAL: State = {
  pods: [],
  lockedStudentIds: [],
  sortMode: "alphabetical",
  sortModeBeforeSelection: null,
  regroupSelecting: false,
  regroupConfirmNeeded: false,
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
          regroupConfirmNeeded: false,
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
          regroupConfirmNeeded: true,
          currentSeed: result.seed,
        });
        return { ok: true, pods: result.pods, seed: result.seed };
      },
      resetPods: () => set({ ...INITIAL }),
      setSortMode: (mode) => set({ sortMode: mode }),
      setRegroupConfirmNeeded: (value) =>
        set({ regroupConfirmNeeded: value }),
      setCurrentEntryId: (id) => set({ currentEntryId: id }),
      moveStudent: (studentId, toPodId) => {
        const state = get();
        const result = moveStudentLogic(state.pods, studentId, toPodId, {
          lockedStudentIds: state.lockedStudentIds,
        });
        if (result.ok) set({ pods: result.pods, regroupConfirmNeeded: false });
        return result;
      },
      addStudentToPod: (student, toPodId) => {
        const state = get();
        const result = addStudentLogic(state.pods, student, toPodId, {
          lockedStudentIds: state.lockedStudentIds,
        });
        if (result.ok) set({ pods: result.pods, regroupConfirmNeeded: false });
        return result;
      },
      removeStudentFromPod: (studentId) => {
        const state = get();
        const result = removeStudentLogic(state.pods, studentId, {
          lockedStudentIds: state.lockedStudentIds,
        });
        if (result.ok) set({ pods: result.pods, regroupConfirmNeeded: false });
        return result;
      },
      togglePodLock: (podId) => {
        set((state) => ({
          pods: state.pods.map((p) =>
            p.id === podId ? { ...p, isLocked: !p.isLocked } : p,
          ),
          regroupConfirmNeeded: false,
        }));
      },
      toggleStudentLock: (studentId) => {
        set((state) => {
          const has = state.lockedStudentIds.includes(studentId);
          return {
            lockedStudentIds: has
              ? state.lockedStudentIds.filter((id) => id !== studentId)
              : [...state.lockedStudentIds, studentId],
            regroupConfirmNeeded: false,
          };
        });
      },
      enterRegroupSelection: () => {
        set((state) => ({
          regroupSelecting: true,
          sortModeBeforeSelection: state.sortMode,
          sortMode: "grouped",
          lockedStudentIds: [],
          pods: state.pods.map((p) => ({ ...p, isLocked: false })),
        }));
      },
      exitRegroupSelection: () => {
        set((state) => ({
          regroupSelecting: false,
          sortMode: state.sortModeBeforeSelection ?? state.sortMode,
          sortModeBeforeSelection: null,
          lockedStudentIds: [],
          pods: state.pods.map((p) => ({ ...p, isLocked: false })),
        }));
      },
      changeEmoji: (podId, emoji, emojiLabel) => {
        const result = changeEmojiLogic(get().pods, podId, emoji, emojiLabel);
        if (result.ok) set({ pods: result.pods, regroupConfirmNeeded: false });
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
          regroupConfirmNeeded: false,
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
          regroupConfirmNeeded: false,
          lastInputs: state.lastInputs
            ? { ...state.lastInputs, robotCount: newPods.length }
            : state.lastInputs,
        });
      },
      loadFromHistory: (snapshot) => {
        set({
          pods: snapshot.pods,
          lockedStudentIds: snapshot.lockedStudentIds,
          sortMode: "alphabetical",
          regroupConfirmNeeded: false,
          currentSeed: snapshot.seed,
          currentClassId: snapshot.classId,
          lastInputs: {
            students: snapshot.students,
            presentCount: snapshot.presentCount,
            robotCount: snapshot.robotCount,
          },
          currentEntryId: snapshot.entryId ?? null,
        });
      },
    }),
    {
      name: "c360-pods-state",
      version: 4,
      skipHydration: true,
      partialize: (state) => ({
        pods: state.pods.map((p) => ({ ...p, isLocked: false })),
        regroupConfirmNeeded: state.regroupConfirmNeeded,
        currentSeed: state.currentSeed,
        currentClassId: state.currentClassId,
        lastInputs: state.lastInputs,
        currentEntryId: state.currentEntryId,
      }),
      migrate: (persistedState, version) => {
        const fresh = {
          pods: [] as Pod[],
          regroupConfirmNeeded: false,
          currentSeed: null,
          currentClassId: null,
          lastInputs: null,
          currentEntryId: null,
        };
        if (version < 4) return fresh;
        return (persistedState ?? fresh) as typeof fresh;
      },
    },
  ),
);
