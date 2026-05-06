/**
 * Tipos de las tablas Supabase que el MVP usa (ver CLAUDE_SCHEMA.md).
 * Solo se declaran los campos que la app lee/escribe — no toda la columna
 * de la BD.
 */

export interface Student {
  id: string;
  full_name: string;
  initials: string | null;
  performance_score: number | null;
  is_absent: boolean | null;
  class_id: string | null;
}

export interface Group {
  id: string;
  session_id: string | null;
  name: string;
  color: string | null;
}

export interface GroupMember {
  id: string;
  group_id: string | null;
  student_id: string | null;
  is_locked: boolean | null;
  is_absent: boolean | null;
}

export interface GroupSession {
  id: string;
  name: string;
  class_id: string | null;
  status: string | null;
  max_group_size: number | null;
  min_group_size: number | null;
  created_at: string | null;
}

export type EvaluationStatus = "pending" | "draft" | "published" | "locked";

export interface Evaluation {
  id: string;
  group_id: string | null;
  session_id: string | null;
  group_score: number | null;
  /** Schema lo declara `text`; en código tratar como EvaluationStatus. */
  status: string | null;
  published_at: string | null;
}

export interface IndividualScore {
  id: string;
  evaluation_id: string | null;
  student_id: string | null;
  score_override: number | null;
}
