import { getSupabaseClient } from "@/lib/supabase/client";
import type { GroupMember } from "@/lib/types";

/**
 * Devuelve todos los `group_members` cuyos `group_id` están en la lista.
 * `group_members` no tiene `session_id` directo — se filtra por los grupos
 * que pertenecen a la sesión actual.
 */
export async function listMembersByGroupIds(
  groupIds: readonly string[],
): Promise<GroupMember[]> {
  if (groupIds.length === 0) return [];
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("group_members")
    .select("id, group_id, student_id, is_locked, is_absent")
    .in("group_id", groupIds);
  if (error) throw error;
  return (data ?? []) as GroupMember[];
}

/**
 * Asignar (o mover) un alumno a un grupo dentro de una sesión.
 *
 * El modelo del prototipo es: un alumno está en un único grupo por sesión.
 * Para garantizarlo, primero se borra cualquier `group_members` previo del
 * alumno en cualquier grupo de la sesión y luego se inserta en el destino.
 *
 * No es transaccional (cliente Supabase). Si el INSERT falla tras el DELETE,
 * el alumno queda sin asignar — recargar arregla el estado.
 */
export async function assignStudentToGroup(
  studentId: string,
  groupId: string,
  sessionGroupIds: readonly string[],
): Promise<void> {
  if (sessionGroupIds.length === 0) {
    throw new Error("La sesión no tiene grupos.");
  }
  const supabase = getSupabaseClient();
  const { error: delError } = await supabase
    .from("group_members")
    .delete()
    .eq("student_id", studentId)
    .in("group_id", sessionGroupIds);
  if (delError) throw delError;
  const { error: insError } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, student_id: studentId });
  if (insError) throw insError;
}

/** Devolver un alumno a "sin asignar" en una sesión concreta. */
export async function unassignStudent(
  studentId: string,
  sessionGroupIds: readonly string[],
): Promise<void> {
  if (sessionGroupIds.length === 0) return;
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("student_id", studentId)
    .in("group_id", sessionGroupIds);
  if (error) throw error;
}

/**
 * Inserta varias asignaciones en una sola query.
 *
 * El caller garantiza que ningún alumno de `pairs` esté ya asignado en
 * algún grupo de la sesión (si lo está, el UNIQUE(group_id, student_id)
 * disparará error solo si cae en el mismo grupo destino).
 */
export async function bulkAssignStudents(
  pairs: ReadonlyArray<{ studentId: string; groupId: string }>,
): Promise<void> {
  if (pairs.length === 0) return;
  const supabase = getSupabaseClient();
  const rows = pairs.map((p) => ({
    student_id: p.studentId,
    group_id: p.groupId,
  }));
  const { error } = await supabase.from("group_members").insert(rows);
  if (error) throw error;
}
