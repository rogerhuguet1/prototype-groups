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
