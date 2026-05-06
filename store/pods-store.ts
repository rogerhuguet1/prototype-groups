"use client";

import { create } from "zustand";
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
  type MoveStudentResult,
} from "@/lib/pods/move-student";

export type SortMode = "alphabetical" | "grouped";

type State = {
  pods: Pod[];
  viewWithPods: boolean;
  sortMode: SortMode;
};

type Actions = {
  createPodsFromInput: (input: {
    students: Student[];
    presentCount: number;
    robotCount: number;
  }) => void;
  resetPods: () => void;
  setViewWithPods: (on: boolean) => void;
  setSortMode: (mode: SortMode) => void;
  moveStudent: (studentId: string, toPodId: string) => MoveStudentResult;
  addStudentToPod: (student: Student, toPodId: string) => MoveStudentResult;
  addEmptyPod: () => void;
};

const INITIAL: State = {
  pods: [],
  viewWithPods: false,
  sortMode: "alphabetical",
};

export const usePodsStore = create<State & Actions>((set, get) => ({
  ...INITIAL,
  createPodsFromInput: ({ students, presentCount, robotCount }) => {
    const pods = createPods({ students, presentCount, robotCount });
    set({ pods, viewWithPods: true, sortMode: "grouped" });
  },
  resetPods: () => set({ ...INITIAL }),
  setViewWithPods: (on) => set({ viewWithPods: on }),
  setSortMode: (mode) => set({ sortMode: mode }),
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
  addEmptyPod: () => {
    const state = get();
    const maxCapacity =
      state.pods[0]?.maxCapacity ?? DEFAULT_MAX_PER_POD;
    const newPod = createEmptyPod(state.pods.length, maxCapacity);
    set({
      pods: [...state.pods, newPod],
      viewWithPods: true,
      sortMode: "grouped",
    });
  },
}));
