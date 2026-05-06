import { getSupabaseClient } from "@/lib/supabase/client";
import type { Student } from "@/lib/types";

export async function listStudentsByClass(classId: string): Promise<Student[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("students")
    .select("id, full_name, initials, performance_score, is_absent, class_id")
    .eq("class_id", classId)
    .order("full_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Student[];
}
