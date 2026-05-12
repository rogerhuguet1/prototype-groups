"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createEmptyPod,
  createPods,
  createPodsByLevel,
  createPodsByProgress,
  DEFAULT_MAX_PER_POD,
  GROUP_NAMES,
  groupNameForIndex,
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
  createPodAndAssignStudent: (student: Student) => void;
  renamePod: (podId: string, newName: string) => void;
};

const INITIAL: State = {
  pods: [],
  lockedStudentIds: [],
  lastRobotCount: null,
};

// Renumera SOLO los ids (pod-1..N). Conserva el nombre que cada pod tiene
// asignado actualmente (el profe puede haberlo cambiado manualmente).
function renumberPods(pods: Pod[]): Pod[] {
  return pods.map((p, i) => ({ ...p, id: `pod-${i + 1}` }));
}

function nextAvailableName(existing: Pod[]): string {
  const used = new Set(existing.map((p) => p.name));
  for (const candidate of GROUP_NAMES) {
    if (!used.has(candidate)) return candidate;
  }
  return groupNameForIndex(existing.length);
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
      addEmptyPod: () => {
        const state = get();
        const maxCapacity =
          state.pods[0]?.maxCapacity ?? DEFAULT_MAX_PER_POD;
        const newPod = createEmptyPod({
          existing: state.pods,
          maxCapacity,
        });
        // Toma el primer GROUP_NAMES disponible (en lugar del que asigna
        // createEmptyPod por índice, que podría colisionar si el profe
        // renombró pods antes).
        const newPodWithFreeName = {
          ...newPod,
          name: nextAvailableName(state.pods),
        };
        set({ pods: [...state.pods, newPodWithFreeName] });
      },
      deletePod: (podId) => {
        set((state) => {
          const target = state.pods.find((p) => p.id === podId);
          if (!target) return {};
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
      createPodAndAssignStudent: (student) => {
        const state = get();
        const maxCapacity =
          state.pods[0]?.maxCapacity ?? DEFAULT_MAX_PER_POD;
        const newPod = createEmptyPod({
          existing: state.pods,
          maxCapacity,
        });
        const cleanedPods = state.pods.map((p) => ({
          ...p,
          students: p.students.filter((s) => s.id !== student.id),
        }));
        const podWithStudent = {
          ...newPod,
          name: nextAvailableName(cleanedPods),
          students: [{ id: student.id, full_name: student.full_name }],
        };
        set({
          pods: [...cleanedPods, podWithStudent],
        });
      },
      renamePod: (podId, newName) => {
        set((state) => {
          const target = state.pods.find((p) => p.id === podId);
          if (!target) return {};
          if (target.name === newName) return {};
          const other = state.pods.find(
            (p) => p.name === newName && p.id !== podId,
          );
          if (other) {
            // Swap entre los dos pods.
            const oldName = target.name;
            return {
              pods: state.pods.map((p) => {
                if (p.id === podId) return { ...p, name: newName };
                if (p.id === other.id) return { ...p, name: oldName };
                return p;
              }),
            };
          }
          return {
            pods: state.pods.map((p) =>
              p.id === podId ? { ...p, name: newName } : p,
            ),
          };
        });
      },
    }),
    {
      name: "c360-pods-state",
      version: 9,
      skipHydration: true,
      partialize: (state): Pick<State, "pods" | "lastRobotCount"> => ({
        pods: state.pods,
        lastRobotCount: state.lastRobotCount,
      }),
      migrate: (persistedState, version) => {
        // v < 9 limpia campos viejos (emoji, emojiLabel, evaluation), añade
        // 'name' por índice y trunca pods que excedan maxCapacity.
        if (version < 9) {
          const prev =
            (persistedState ?? {}) as {
              pods?: Array<Record<string, unknown>>;
              lastRobotCount?: number | null;
            };
          const rawPods = prev.pods ?? [];
          const cleanedPods: Pod[] = rawPods.map((raw, idx) => {
            const max =
              typeof raw["maxCapacity"] === "number"
                ? (raw["maxCapacity"] as number)
                : DEFAULT_MAX_PER_POD;
            const studentsRaw = Array.isArray(raw["students"])
              ? (raw["students"] as Array<{ id: string; full_name: string }>)
              : [];
            // Trunca a maxCapacity: el exceso queda fuera y aparecerá como
            // "Pendientes de asignar".
            const truncated = studentsRaw.slice(0, max);
            const color = raw["color"] as Pod["color"];
            return {
              id: `pod-${idx + 1}`,
              name: groupNameForIndex(idx),
              color,
              students: truncated,
              maxCapacity: max,
            };
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
