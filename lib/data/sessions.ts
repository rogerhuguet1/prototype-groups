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
