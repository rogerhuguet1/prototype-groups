"use client";

import { create } from "zustand";
import { createPods, type Pod, type Student } from "@/lib/pods/create-pods";

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
};

const INITIAL: State = {
  pods: [],
  viewWithPods: false,
  sortMode: "alphabetical",
};

export const usePodsStore = create<State & Actions>((set) => ({
  ...INITIAL,
  createPodsFromInput: ({ students, presentCount, robotCount }) => {
    const pods = createPods({ students, presentCount, robotCount });
    set({ pods, viewWithPods: true, sortMode: "grouped" });
  },
  resetPods: () => set({ ...INITIAL }),
  setViewWithPods: (on) => set({ viewWithPods: on }),
  setSortMode: (mode) => set({ sortMode: mode }),
}));
