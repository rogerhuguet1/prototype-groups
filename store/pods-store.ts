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
  lastPresentCount: number | null;
  // No persistido. true cuando el persist middleware ha rehidratado el state.
  // Permite al UI distinguir entre 'aún cargando' y 'no hay sesión guardada'.
  hydrated: boolean;
  // No persistido. Controla la apertura del PodGroupingModal desde cualquier
  // sitio (botón 'Agrupar' o SessionPrompt al elegir 'Empezar nueva sesión').
  groupingModalOpen: boolean;
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
  markHydrated: () => void;
  openGroupingModal: () => void;
  closeGroupingModal: () => void;
};

const INITIAL: State = {
  pods: [],
  lockedStudentIds: [],
  sortMode: "alphabetical",
  lastRobotCount: null,
  lastPresentCount: null,
  hydrated: false,
  groupingModalOpen: false,
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
          sortMode: "grouped",
          lastRobotCount: robotCount,
          lastPresentCount: presentStudents.length,
        });
      },
      resetPods: () =>
        set((state) => ({
          ...INITIAL,
          hydrated: state.hydrated,
          groupingModalOpen: state.groupingModalOpen,
        })),
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
      deletePod: (podId) => {
        set((state) => {
          const target = state.pods.find((p) => p.id === podId);
          if (!target) return {};
          // Quitar locks de los alumnos del pod eliminado: dejarian de tener
          // un grupo al que pertenecer, mejor liberarlos al pool 'pendientes'.
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
      markHydrated: () => set({ hydrated: true }),
      openGroupingModal: () => set({ groupingModalOpen: true }),
      closeGroupingModal: () => set({ groupingModalOpen: false }),
    }),
    {
      name: "c360-pods-state",
      version: 7,
      skipHydration: true,
      partialize: (
        state,
      ): Pick<State, "pods" | "lastRobotCount" | "lastPresentCount"> => ({
        // Solo persistimos composicion (sin evaluation), lastRobotCount y
        // lastPresentCount (para precarga del editor inline). Candados,
        // sortMode, evaluation y hydrated se resetean al cerrar pestaña.
        pods: state.pods.map((p) => ({ ...p, evaluation: null as PodEvaluation })),
        lastRobotCount: state.lastRobotCount,
        lastPresentCount: state.lastPresentCount,
      }),
      migrate: (persistedState, version) => {
        if (version < 7) {
          // v6 -> v7 anade lastPresentCount. Para no descartar pods existentes
          // del v6, mantenemos lo que haya y dejamos lastPresentCount=null.
          const prev =
            (persistedState ?? {}) as Partial<
              Pick<State, "pods" | "lastRobotCount">
            >;
          return {
            ...INITIAL,
            pods: prev.pods ?? [],
            lastRobotCount: prev.lastRobotCount ?? null,
          };
        }
        return persistedState as State;
      },
    },
  ),
);
