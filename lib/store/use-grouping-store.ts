"use client";

import { create } from "zustand";
import type {
  Evaluation,
  EvaluationStatus,
  HistorySession,
  Panel,
  PanelMembership,
  SessionConfig,
  Student,
  ToastKind,
  ToastMessage,
} from "@/lib/domain/types";
import {
  ALLOWED_EVAL_TRANSITIONS,
  DEFAULT_MAX_GROUP_SIZE,
  DEFAULT_MIN_GROUP_SIZE,
  EVAL_STATUS_LABEL,
  HARD_MAX_GROUP_SIZE,
  HARD_MIN_GROUP_SIZE,
} from "@/lib/domain/constants";
import { isValidScore } from "@/lib/domain/grading";
import { distributeRoundRobin } from "@/lib/utils/distribute";
import { fullName } from "@/lib/utils/initials";
import { MOCK_HISTORY } from "@/lib/data/mock-history";
import {
  MOCK_INITIAL_MEMBERSHIPS,
  MOCK_PANELS,
} from "@/lib/data/mock-panels";
import { MOCK_STUDENTS } from "@/lib/data/mock-students";
import { t } from "@/lib/i18n/strings";

interface GroupingState {
  students: Student[];
  panels: Panel[];
  memberships: PanelMembership[];
  evaluations: Record<string, Evaluation>;
  sessionConfig: SessionConfig;
  history: HistorySession[];
  selectedPanelId: string | null;
  searchQuery: string;
  toasts: ToastMessage[];
}

interface GroupingActions {
  // Selección y búsqueda
  selectPanel: (panelId: string | null) => void;
  setSearchQuery: (query: string) => void;

  // CRUD paneles
  createPanel: (name?: string) => void;
  renamePanel: (panelId: string, newName: string) => void;
  deletePanel: (panelId: string) => void;
  clearAllPanels: () => void;
  distributeAuto: () => void;

  // Membership
  assignStudent: (studentId: string, panelId: string) => boolean;
  moveStudent: (studentId: string, toPanelId: string) => boolean;
  unassignStudent: (studentId: string) => void;

  // Evaluación
  setGroupScore: (panelId: string, score: number | null) => void;
  setIndividualOverride: (
    panelId: string,
    studentId: string,
    score: number | null,
  ) => void;
  changeEvalStatus: (panelId: string, next: EvaluationStatus) => void;

  // Sesión y configuración
  updateSessionConfig: (partial: Partial<SessionConfig>) => void;
  saveSession: () => void;

  // Toasts
  pushToast: (kind: ToastKind, message: string) => void;
  dismissToast: (id: string) => void;
}

export type GroupingStore = GroupingState & GroupingActions;

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function ensureEvaluation(
  evaluations: Record<string, Evaluation>,
  panelId: string,
): Record<string, Evaluation> {
  if (evaluations[panelId]) return evaluations;
  return {
    ...evaluations,
    [panelId]: {
      panelId,
      groupScore: null,
      status: "pending",
      individualOverrides: {},
    },
  };
}

const initialConfig: SessionConfig = {
  name: "Proyecto Robótica · Mayo",
  minGroupSize: DEFAULT_MIN_GROUP_SIZE,
  maxGroupSize: DEFAULT_MAX_GROUP_SIZE,
};

export const useGroupingStore = create<GroupingStore>((set, get) => ({
  students: MOCK_STUDENTS,
  panels: MOCK_PANELS,
  memberships: MOCK_INITIAL_MEMBERSHIPS,
  evaluations: MOCK_PANELS.reduce<Record<string, Evaluation>>((acc, p) => {
    acc[p.id] = {
      panelId: p.id,
      groupScore: null,
      status: "pending",
      individualOverrides: {},
    };
    return acc;
  }, {}),
  sessionConfig: initialConfig,
  history: MOCK_HISTORY,
  selectedPanelId: null,
  searchQuery: "",
  toasts: [],

  selectPanel: (panelId) => set({ selectedPanelId: panelId }),
  setSearchQuery: (q) => set({ searchQuery: q }),

  createPanel: (name) => {
    const { panels, sessionConfig, evaluations } = get();
    const id = newId("pnl");
    const finalName = name?.trim() || `Grupo ${panels.length + 1}`;
    const next: Panel = {
      id,
      name: finalName,
      capacity: sessionConfig.maxGroupSize,
      sortOrder: panels.length,
    };
    set({
      panels: [...panels, next],
      evaluations: ensureEvaluation(evaluations, id),
      selectedPanelId: id,
    });
    get().pushToast("success", t.toast.panel_created(finalName));
  },

  renamePanel: (panelId, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    set((state) => ({
      panels: state.panels.map((p) =>
        p.id === panelId ? { ...p, name: trimmed } : p,
      ),
    }));
    get().pushToast("info", t.toast.panel_renamed(trimmed));
  },

  deletePanel: (panelId) => {
    const panel = get().panels.find((p) => p.id === panelId);
    if (!panel) return;
    set((state) => {
      const restEvaluations = { ...state.evaluations };
      delete restEvaluations[panelId];
      return {
        panels: state.panels.filter((p) => p.id !== panelId),
        memberships: state.memberships.filter((m) => m.panelId !== panelId),
        evaluations: restEvaluations,
        selectedPanelId:
          state.selectedPanelId === panelId ? null : state.selectedPanelId,
      };
    });
    get().pushToast("info", t.toast.panel_deleted(panel.name));
  },

  clearAllPanels: () => {
    set((state) => ({ memberships: [] }));
    get().pushToast("info", t.toast.panels_cleared);
  },

  distributeAuto: () => {
    const state = get();
    if (state.panels.length === 0) {
      get().pushToast("warning", t.toast.distribute_no_panels);
      return;
    }
    const assignedIds = new Set(state.memberships.map((m) => m.studentId));
    const unassigned = state.students
      .map((s) => s.id)
      .filter((id) => !assignedIds.has(id));
    if (unassigned.length === 0) return;
    const counts: Record<string, number> = {};
    for (const m of state.memberships) {
      counts[m.panelId] = (counts[m.panelId] ?? 0) + 1;
    }
    const { newMemberships, leftover } = distributeRoundRobin({
      unassignedStudentIds: unassigned,
      panels: state.panels,
      currentCount: counts,
    });
    set({ memberships: [...state.memberships, ...newMemberships] });
    get().pushToast("success", t.toast.distributed(newMemberships.length));
    if (leftover.length > 0) {
      get().pushToast("warning", t.toast.distribute_leftover(leftover.length));
    }
  },

  assignStudent: (studentId, panelId) => {
    const state = get();
    const panel = state.panels.find((p) => p.id === panelId);
    if (!panel) return false;
    const currentInPanel = state.memberships.filter(
      (m) => m.panelId === panelId,
    ).length;
    const alreadyHere = state.memberships.find(
      (m) => m.studentId === studentId && m.panelId === panelId,
    );
    if (alreadyHere) return true;
    if (currentInPanel >= panel.capacity) {
      get().pushToast("error", t.toast.panel_full(panel.name));
      return false;
    }
    const filtered = state.memberships.filter((m) => m.studentId !== studentId);
    set({
      memberships: [
        ...filtered,
        { panelId, studentId, isLocked: false, isAbsent: false },
      ],
    });
    const student = state.students.find((s) => s.id === studentId);
    if (student) {
      get().pushToast(
        "success",
        t.toast.student_assigned(fullName(student.firstName, student.lastName), panel.name),
      );
    }
    return true;
  },

  moveStudent: (studentId, toPanelId) => {
    const state = get();
    const current = state.memberships.find((m) => m.studentId === studentId);
    if (!current) return get().assignStudent(studentId, toPanelId);
    if (current.panelId === toPanelId) return true;
    const targetPanel = state.panels.find((p) => p.id === toPanelId);
    if (!targetPanel) return false;
    const inTarget = state.memberships.filter((m) => m.panelId === toPanelId).length;
    if (inTarget >= targetPanel.capacity) {
      get().pushToast("error", t.toast.panel_full(targetPanel.name));
      return false;
    }
    set({
      memberships: state.memberships.map((m) =>
        m.studentId === studentId ? { ...m, panelId: toPanelId } : m,
      ),
    });
    const student = state.students.find((s) => s.id === studentId);
    if (student) {
      get().pushToast(
        "success",
        t.toast.student_moved(fullName(student.firstName, student.lastName), targetPanel.name),
      );
    }
    return true;
  },

  unassignStudent: (studentId) => {
    const state = get();
    const current = state.memberships.find((m) => m.studentId === studentId);
    if (!current) return;
    set({
      memberships: state.memberships.filter((m) => m.studentId !== studentId),
    });
    const student = state.students.find((s) => s.id === studentId);
    if (student) {
      get().pushToast(
        "info",
        t.toast.student_unassigned(fullName(student.firstName, student.lastName)),
      );
    }
  },

  setGroupScore: (panelId, score) => {
    if (score !== null && !isValidScore(score)) {
      get().pushToast("error", t.toast.score_invalid);
      return;
    }
    set((state) => ({
      evaluations: {
        ...ensureEvaluation(state.evaluations, panelId),
        [panelId]: {
          ...(state.evaluations[panelId] ?? {
            panelId,
            groupScore: null,
            status: "pending",
            individualOverrides: {},
          }),
          groupScore: score,
        },
      },
    }));
  },

  setIndividualOverride: (panelId, studentId, score) => {
    if (score !== null && !isValidScore(score)) {
      get().pushToast("error", t.toast.score_invalid);
      return;
    }
    set((state) => {
      const evals = ensureEvaluation(state.evaluations, panelId);
      const evaluation = evals[panelId]!;
      const overrides = { ...evaluation.individualOverrides };
      if (score === null) {
        delete overrides[studentId];
      } else {
        overrides[studentId] = score;
      }
      return {
        evaluations: {
          ...evals,
          [panelId]: { ...evaluation, individualOverrides: overrides },
        },
      };
    });
  },

  changeEvalStatus: (panelId, next) => {
    const state = get();
    const evaluation =
      state.evaluations[panelId] ?? {
        panelId,
        groupScore: null,
        status: "pending" as EvaluationStatus,
        individualOverrides: {},
      };
    const allowed = ALLOWED_EVAL_TRANSITIONS[evaluation.status];
    if (!allowed.includes(next)) return;

    if (next === "published") {
      const memberCount = state.memberships.filter(
        (m) => m.panelId === panelId,
      ).length;
      if (memberCount === 0) {
        get().pushToast("error", t.toast.eval_blocked_no_members);
        return;
      }
      const hasGroupScore = evaluation.groupScore !== null;
      const memberIds = state.memberships
        .filter((m) => m.panelId === panelId)
        .map((m) => m.studentId);
      const allIndividual = memberIds.every(
        (id) => evaluation.individualOverrides[id] !== undefined,
      );
      if (!hasGroupScore && !allIndividual) {
        get().pushToast("error", t.toast.eval_blocked_no_score);
        return;
      }
    }

    set((s) => ({
      evaluations: {
        ...s.evaluations,
        [panelId]: { ...evaluation, status: next },
      },
    }));
    get().pushToast("info", t.toast.eval_state_changed(EVAL_STATUS_LABEL[next]));
  },

  updateSessionConfig: (partial) => {
    set((state) => {
      const merged = { ...state.sessionConfig, ...partial };
      const max = clamp(
        merged.maxGroupSize,
        Math.max(HARD_MIN_GROUP_SIZE, merged.minGroupSize),
        HARD_MAX_GROUP_SIZE,
      );
      const min = clamp(merged.minGroupSize, HARD_MIN_GROUP_SIZE, max);
      const config: SessionConfig = {
        name: merged.name,
        minGroupSize: min,
        maxGroupSize: max,
      };
      return {
        sessionConfig: config,
        panels: state.panels.map((p) => ({ ...p, capacity: max })),
      };
    });
  },

  saveSession: () => {
    const state = get();
    const assigned = new Set(state.memberships.map((m) => m.studentId));
    const entry: HistorySession = {
      id: newId("ses"),
      name: state.sessionConfig.name,
      date: new Date().toISOString(),
      panelCount: state.panels.length,
      assignedStudentCount: assigned.size,
      status: "archived",
    };
    set({ history: [entry, ...state.history] });
    get().pushToast("success", t.toast.saved);
  },

  pushToast: (kind, message) => {
    const id = newId("tst");
    const toast: ToastMessage = { id, kind, message };
    set((state) => ({ toasts: [...state.toasts, toast] }));
    if (typeof window !== "undefined") {
      window.setTimeout(() => get().dismissToast(id), 3500);
    }
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

// ===================== Selectors derivados =====================

export function selectUnassignedStudents(state: GroupingStore): Student[] {
  const assigned = new Set(state.memberships.map((m) => m.studentId));
  return state.students.filter((s) => !assigned.has(s.id));
}

export function selectStudentsInPanel(
  state: GroupingStore,
  panelId: string,
): Student[] {
  const ids = new Set(
    state.memberships.filter((m) => m.panelId === panelId).map((m) => m.studentId),
  );
  return state.students.filter((s) => ids.has(s.id));
}

export function selectPanelById(
  state: GroupingStore,
  panelId: string,
): Panel | undefined {
  return state.panels.find((p) => p.id === panelId);
}

export function selectStudentById(
  state: GroupingStore,
  studentId: string,
): Student | undefined {
  return state.students.find((s) => s.id === studentId);
}
