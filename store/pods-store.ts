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
  viewWithPods: boolean;
  sortMode: SortMode;
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
  setViewWithPods: (on: boolean) => void;
  setSortMode: (mode: SortMode) => void;
  setRegroupConfirmNeeded: (value: boolean) => void;
  setCurrentEntryId: (id: string | null) => void;
  moveStudent: (studentId: string, toPodId: string) => MoveStudentResult;
  addStudentToPod: (student: Student, toPodId: string) => MoveStudentResult;
  removeStudentFromPod: (studentId: string) => MoveStudentResult;
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
    entryId?: string;
  }) => void;
};

const INITIAL: State = {
  pods: [],
  viewWithPods: false,
  sortMode: "alphabetical",
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
          viewWithPods: true,
          sortMode: "grouped",
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
          viewWithPods: true,
          sortMode: "grouped",
          regroupConfirmNeeded: true,
          currentSeed: result.seed,
        });
        return { ok: true, pods: result.pods, seed: result.seed };
      },
      resetPods: () => set({ ...INITIAL }),
      setViewWithPods: (on) => set({ viewWithPods: on }),
      setSortMode: (mode) => set({ sortMode: mode }),
      setRegroupConfirmNeeded: (value) =>
        set({ regroupConfirmNeeded: value }),
      setCurrentEntryId: (id) => set({ currentEntryId: id }),
      moveStudent: (studentId, toPodId) => {
        const result = moveStudentLogic(get().pods, studentId, toPodId);
        if (result.ok) set({ pods: result.pods, regroupConfirmNeeded: false });
        return result;
      },
      addStudentToPod: (student, toPodId) => {
        const result = addStudentLogic(get().pods, student, toPodId);
        if (result.ok) set({ pods: result.pods, regroupConfirmNeeded: false });
        return result;
      },
      removeStudentFromPod: (studentId) => {
        const result = removeStudentLogic(get().pods, studentId);
        if (result.ok) set({ pods: result.pods, regroupConfirmNeeded: false });
        return result;
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
        set({
          pods: [...state.pods, newPod],
          viewWithPods: true,
          sortMode: "grouped",
          regroupConfirmNeeded: false,
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
        set({
          pods: [...cleanedPods, podWithStudent],
          viewWithPods: true,
          regroupConfirmNeeded: false,
        });
      },
      loadFromHistory: (snapshot) => {
        set({
          pods: snapshot.pods,
          viewWithPods: true,
          sortMode: "grouped",
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
      skipHydration: true,
      partialize: (state) => ({
        pods: state.pods,
        viewWithPods: state.viewWithPods,
        sortMode: state.sortMode,
        regroupConfirmNeeded: state.regroupConfirmNeeded,
        currentSeed: state.currentSeed,
        currentClassId: state.currentClassId,
        lastInputs: state.lastInputs,
        currentEntryId: state.currentEntryId,
      }),
    },
  ),
);
