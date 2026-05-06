import { getSupabaseClient } from "@/lib/supabase/client";
import type { IndividualScore } from "@/lib/types";

export async function listScoresByEvalIds(
  evaluationIds: readonly string[],
): Promise<IndividualScore[]> {
  if (evaluationIds.length === 0) return [];
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("individual_scores")
    .select("id, evaluation_id, student_id, score_override")
    .in("evaluation_id", evaluationIds);
  if (error) throw error;
  return (data ?? []) as IndividualScore[];
}

/** Crea o actualiza el override individual. Aprovecha UNIQUE(evaluation_id, student_id). */
export async function upsertIndividualOverride(
  evaluationId: string,
  studentId: string,
  score: number,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("individual_scores").upsert(
    {
      evaluation_id: evaluationId,
      student_id: studentId,
      score_override: score,
    },
    { onConflict: "evaluation_id,student_id" },
  );
  if (error) throw error;
}

/** Borra el override (el alumno vuelve a heredar la nota grupal). */
export async function deleteIndividualOverride(
  evaluationId: string,
  studentId: string,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("individual_scores")
    .delete()
    .eq("evaluation_id", evaluationId)
    .eq("student_id", studentId);
  if (error) throw error;
}
