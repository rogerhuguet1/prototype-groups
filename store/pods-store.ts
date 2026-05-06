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
  removeStudentFromPod as removeStudentLogic,
  type MoveStudentResult,
} from "@/lib/pods/move-student";
import {
  changePodEmoji as changeEmojiLogic,
  type ChangeEmojiResult,
} from "@/lib/pods/edit-pod";

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
  removeStudentFromPod: (studentId: string) => MoveStudentResult;
  addEmptyPod: () => void;
  changeEmoji: (
    podId: string,
    emoji: string,
    emojiLabel: string,
  ) => ChangeEmojiResult;
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
  removeStudentFromPod: (studentId) => {
    const result = removeStudentLogic(get().pods, studentId);
    if (result.ok) set({ pods: result.pods });
    return result;
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
    set({
      pods: [...state.pods, newPod],
      viewWithPods: true,
      sortMode: "grouped",
    });
  },
}));
