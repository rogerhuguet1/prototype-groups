import { getSupabaseClient } from "@/lib/supabase/client";
import type { GroupSession } from "@/lib/types";

const SELECT =
  "id, name, class_id, status, max_group_size, min_group_size, created_at";

export async function getSessionById(
  sessionId: string,
): Promise<GroupSession | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("group_sessions")
    .select(SELECT)
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw error;
  return (data as GroupSession | null) ?? null;
}

/** Sesiones archivadas o bloqueadas de una clase, ordenadas por fecha desc. */
export async function listArchivedSessions(
  classId: string,
): Promise<GroupSession[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("group_sessions")
    .select(SELECT)
    .eq("class_id", classId)
    .in("status", ["archived", "locked"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as GroupSession[];
}

export interface SessionConfigPatch {
  name?: string;
  min_group_size?: number;
  max_group_size?: number;
}

/** Actualiza solo los campos provistos. Trim del nombre incluido. */
export async function updateSessionConfig(
  sessionId: string,
  patch: SessionConfigPatch,
): Promise<void> {
  const updates: Record<string, string | number> = {};
  if (patch.name !== undefined) {
    const trimmed = patch.name.trim();
    if (!trimmed) throw new Error("El nombre no puede estar vacío.");
    updates.name = trimmed;
  }
  if (patch.min_group_size !== undefined) {
    updates.min_group_size = patch.min_group_size;
  }
  if (patch.max_group_size !== undefined) {
    updates.max_group_size = patch.max_group_size;
  }
  if (Object.keys(updates).length === 0) return;
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("group_sessions")
    .update(updates)
    .eq("id", sessionId);
  if (error) throw error;
}
