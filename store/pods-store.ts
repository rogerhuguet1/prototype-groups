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

export type GroupingMode = "random" | RegroupMode | "by-progress";

type State = {
  pods: Pod[];
  lockedStudentIds: string[];
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
  setLastRobotCount: (n: number | null) => void;
  moveStudent: (studentId: string, toPodId: string) => MoveStudentResult;
  addStudentToPod: (student: Student, toPodId: string) => MoveStudentResult;
  removeStudentFromPod: (studentId: string) => MoveStudentResult;
  toggleStudentLock: (studentId: string) => void;
  addEmptyPod: () => void;
  deletePod: (podId: string) => void;
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
  lastRobotCount: null,
};

function renumberPods(pods: Pod[]): Pod[] {
  return pods.map((p, i) => ({ ...p, id: `pod-${i + 1}` }));
}

export const usePodsStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      createOrRegroup: ({
        mode,
        presentStudents,
        robotCount,
        scoreFn,
        progressFn,
      }) => {
        const state = get();
        const hasPods = state.pods.length > 0;
        const sameCount = state.pods.length === robotCount;

        let result: { pods: Pod[] };

        if (mode === "random") {
          if (hasPods && sameCount) {
            // mismo numero de grupos: mantiene emojis/colores y respeta candados
            result = regroupWithLocks({
              currentPods: state.pods,
              lockedStudentIds: state.lockedStudentIds,
              allPresentStudents: presentStudents,
            });
          } else {
            // primera vez o cambio de count: fresh start
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
          lastRobotCount: robotCount,
        });
      },
      resetPods: () => set({ ...INITIAL }),
      setLastRobotCount: (n) => set({ lastRobotCount: n }),
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
        set({ pods: [...state.pods, newPod] });
      },
      deletePod: (podId) => {
        set((state) => {
          const target = state.pods.find((p) => p.id === podId);
          if (!target) return {};
          // Quitar locks de los alumnos del pod eliminado: vuelven a pendientes.
          const releasedIds = new Set(target.students.map((s) => s.id));
          const remainingLocks = state.lockedStudentIds.filter(
            (id) => !releasedIds.has(id),
          );
          const remaining = state.pods.filter((p) => p.id !== podId);
          return {
            pods: renumberPods(remaining),
            lockedStudentIds: remainingLocks,
          };
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
      version: 8,
      skipHydration: true,
      partialize: (state): Pick<State, "pods" | "lastRobotCount"> => ({
        pods: state.pods,
        lastRobotCount: state.lastRobotCount,
      }),
      migrate: (persistedState, version) => {
        // v < 8 descarta state: el esquema cambio (sin evaluation ni sortMode).
        if (version < 8) {
          const prev =
            (persistedState ?? {}) as Partial<
              Pick<State, "pods" | "lastRobotCount">
            >;
          // Limpia evaluation por si existe en pods de versiones anteriores.
          const cleanedPods = (prev.pods ?? []).map((p: Pod & { evaluation?: unknown }) => {
            const { evaluation: _e, ...rest } = p;
            return rest as Pod;
          });
          return {
            ...INITIAL,
            pods: cleanedPods,
            lastRobotCount: prev.lastRobotCount ?? null,
          };
        }
        return persistedState as State;
      },
    },
  ),
);
