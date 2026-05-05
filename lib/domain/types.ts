/**
 * Tipos del dominio del prototipo.
 *
 * Mapping previsto a Supabase (ver CLAUDE.md §6):
 *   Student.id          → moodle_userid bigint (en producción, no UUID propio)
 *   Panel.id            → vg_panels.id (uuid)
 *   PanelMembership     → vg_panel_members
 *   Evaluation          → vg_evaluations + vg_individual_scores agrupado
 *   SessionConfig       → vg_sessions (campos de configuración)
 *
 * En Fase 0 todos los IDs son strings opacos para no acoplar el prototipo
 * al tipo entero/uuid del backend.
 */

export type StudentLevel = "inicial" | "medio" | "avanzado";

export type EvaluationStatus = "pending" | "draft" | "published" | "locked";

export type SessionStatus = "active" | "archived" | "locked";

export type ScoreBand = "high" | "medium" | "low" | "none";

export interface Student {
  /** ID opaco. En producción será `moodle_userid` (bigint). */
  id: string;
  firstName: string;
  lastName: string;
  /** Nota previa o nivel orientativo del alumno (0–10). */
  baseScore?: number;
  level: StudentLevel;
}

export interface Panel {
  id: string;
  name: string;
  capacity: number;
  sortOrder: number;
}

export interface PanelMembership {
  panelId: string;
  studentId: string;
  isLocked: boolean;
  isAbsent: boolean;
}

export interface Evaluation {
  panelId: string;
  /** Nota grupal (0–10). `null` si todavía no se ha evaluado. */
  groupScore: number | null;
  status: EvaluationStatus;
  /** Override individual: studentId → score (0–10). */
  individualOverrides: Record<string, number>;
  notes?: string;
}

export interface SessionConfig {
  name: string;
  minGroupSize: number;
  maxGroupSize: number;
}

export interface HistorySession {
  id: string;
  name: string;
  /** ISO-8601. */
  date: string;
  panelCount: number;
  assignedStudentCount: number;
  status: SessionStatus;
}

export type ToastKind = "success" | "info" | "warning" | "error";

export interface ToastMessage {
  id: string;
  kind: ToastKind;
  message: string;
}
