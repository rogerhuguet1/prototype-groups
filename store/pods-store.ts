"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createEmptyPod,
  createPods,
  createPodsByLevel,
  createPodsByProgress,
  DEFAULT_MAX_PER_POD,
  type Pod,
  type PodEvaluation,
  type RegroupMode,
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
import { regroupWithLocks } from "@/lib/pods/regroup-with-locks";

export type SortMode = "alphabetical" | "grouped";

export type GroupingMode = "random" | RegroupMode | "by-progress";

type State = {
  pods: Pod[];
  lockedStudentIds: string[];
  sortMode: SortMode;
  lastRobotCount: number | null;
};

type CreateOrRegroupInput = {
  mode: GroupingMode;
  presentStudents: Student[];
  robotCount: number;
  scoreFn?: (studentId: string) => number;
  progressFn?: (studentId: string) => number;
};

type Actions = {
  createOrRegroup: (input: CreateOrRegroupInput) => void;
  resetPods: () => void;
  setSortMode: (mode: SortMode) => void;
  setLastRobotCount: (n: number | null) => void;
  setPodEvaluation: (podId: string, rating: PodEvaluation) => void;
  moveStudent: (studentId: string, toPodId: string) => MoveStudentResult;
  addStudentToPod: (student: Student, toPodId: string) => MoveStudentResult;
  removeStudentFromPod: (studentId: string) => MoveStudentResult;
  toggleStudentLock: (studentId: string) => void;
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
  lastRobotCount: null,
};

export const usePodsStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      createOrRegroup: ({ mode, presentStudents, robotCount, scoreFn, progressFn }) => {
        const state = get();
        const hasPods = state.pods.length > 0;

        let result: { pods: Pod[] };

        if (mode === "random") {
          if (hasPods) {
            // mantiene emojis/colores y respeta candados
            result = regroupWithLocks({
              currentPods: state.pods,
              lockedStudentIds: state.lockedStudentIds,
              allPresentStudents: presentStudents,
            });
          } else {
            result = createPods({
              students: presentStudents,
              presentCount: presentStudents.length,
              robotCount,
            });
          }
        } else if (mode === "by-progress") {
          if (!progressFn || !scoreFn) {
            throw new Error(
              "createOrRegroup: by-progress requiere progressFn y scoreFn",
            );
          }
          result = createPodsByProgress({
            students: presentStudents,
            presentCount: presentStudents.length,
            robotCount,
            progressFn,
            scoreFn,
            lockedStudentIds: state.lockedStudentIds,
            currentPods: state.pods,
          });
        } else {
          // "mixed" | "leveled"
          if (!scoreFn) {
            throw new Error(
              "createOrRegroup: modos por nivel requieren scoreFn",
            );
          }
          result = createPodsByLevel({
            students: presentStudents,
            presentCount: presentStudents.length,
            robotCount,
            mode,
            scoreFn,
            lockedStudentIds: state.lockedStudentIds,
            currentPods: state.pods,
          });
        }

        set({
          pods: result.pods,
          sortMode: "grouped",
          lastRobotCount: robotCount,
        });
      },
      resetPods: () => set({ ...INITIAL }),
      setSortMode: (mode) => set({ sortMode: mode }),
      setLastRobotCount: (n) => set({ lastRobotCount: n }),
      setPodEvaluation: (podId, rating) => {
        set((state) => ({
          pods: state.pods.map((p) =>
            p.id === podId ? { ...p, evaluation: rating } : p,
          ),
        }));
      },
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
        });
      },
    }),
    {
      name: "c360-pods-state",
      version: 6,
      skipHydration: true,
      partialize: (state): Pick<State, "pods" | "lastRobotCount"> => ({
        // v5 spec: solo persistimos composicion (sin evaluation) y lastRobotCount.
        pods: state.pods.map((p) => ({ ...p, evaluation: null as PodEvaluation })),
        lastRobotCount: state.lastRobotCount,
      }),
      migrate: (persistedState, version) => {
        // cualquier version < 6 se descarta porque el esquema cambio
        // (Pod.isLocked -> Pod.evaluation, fuera history-driven keys).
        if (version < 6) return { ...INITIAL };
        return persistedState as State;
      },
    },
  ),
);
