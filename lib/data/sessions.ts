import { getSupabaseClient } from "@/lib/supabase/client";
import type { GroupSession } from "@/lib/types";

export async function getSessionById(
  sessionId: string,
): Promise<GroupSession | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("group_sessions")
    .select("id, name, class_id, status, max_group_size, min_group_size")
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw error;
  return (data as GroupSession | null) ?? null;
}
