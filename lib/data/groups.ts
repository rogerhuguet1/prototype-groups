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
