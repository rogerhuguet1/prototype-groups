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
