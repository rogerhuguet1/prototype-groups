import { getSupabaseClient } from "@/lib/supabase/client";
import type { Group } from "@/lib/types";

export async function listGroupsBySession(sessionId: string): Promise<Group[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("groups")
    .select("id, session_id, name, color")
    .eq("session_id", sessionId)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Group[];
}

/** Carga grupos de varias sesiones en una sola query. Útil para el historial. */
export async function listGroupsBySessionIds(
  sessionIds: readonly string[],
): Promise<Group[]> {
  if (sessionIds.length === 0) return [];
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("groups")
    .select("id, session_id, name, color")
    .in("session_id", sessionIds);
  if (error) throw error;
  return (data ?? []) as Group[];
}

export async function createGroup(
  sessionId: string,
  name: string,
): Promise<Group> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("El nombre del grupo no puede estar vacío.");
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("groups")
    .insert({ session_id: sessionId, name: trimmed })
    .select("id, session_id, name, color")
    .single();
  if (error) throw error;
  return data as Group;
}

export async function renameGroup(
  groupId: string,
  name: string,
): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("El nombre del grupo no puede estar vacío.");
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("groups")
    .update({ name: trimmed })
    .eq("id", groupId);
  if (error) throw error;
}

/**
 * Borrado en cascada manual.
 *
 * El schema no garantiza ON DELETE CASCADE en las FKs hacia `groups` ni
 * hacia `evaluations`. Borramos en orden: scores individuales → evaluaciones
 * del grupo → miembros del grupo → el grupo. Si una de las tablas está
 * vacía para este grupo, el DELETE no falla — solo afecta 0 filas.
 */
export async function deleteGroup(groupId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { data: evals, error: evalsErr } = await supabase
    .from("evaluations")
    .select("id")
    .eq("group_id", groupId);
  if (evalsErr) throw evalsErr;

  const evalIds = (evals ?? []).map((e: { id: string }) => e.id);
  if (evalIds.length > 0) {
    const { error } = await supabase
      .from("individual_scores")
      .delete()
      .in("evaluation_id", evalIds);
    if (error) throw error;
  }

  const { error: delEvalsErr } = await supabase
    .from("evaluations")
    .delete()
    .eq("group_id", groupId);
  if (delEvalsErr) throw delEvalsErr;

  const { error: delMembersErr } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId);
  if (delMembersErr) throw delMembersErr;

  const { error: delGroupErr } = await supabase
    .from("groups")
    .delete()
    .eq("id", groupId);
  if (delGroupErr) throw delGroupErr;
}
