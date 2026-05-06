import { getSupabaseClient } from "@/lib/supabase/client";
import type { Evaluation, EvaluationStatus } from "@/lib/types";

export async function listEvaluationsBySession(
  sessionId: string,
): Promise<Evaluation[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("evaluations")
    .select("id, group_id, session_id, group_score, status, published_at")
    .eq("session_id", sessionId);
  if (error) throw error;
  return (data ?? []) as Evaluation[];
}

/**
 * Devuelve el id de la evaluación del grupo, creándola si no existe.
 * Al crear por primera vez, status = 'draft' (ya hay actividad de evaluación).
 */
export async function ensureEvaluation(
  groupId: string,
  sessionId: string,
): Promise<string> {
  const supabase = getSupabaseClient();
  const { data: existing, error: selError } = await supabase
    .from("evaluations")
    .select("id")
    .eq("group_id", groupId)
    .maybeSingle();
  if (selError) throw selError;
  if (existing) return (existing as { id: string }).id;

  const { data, error } = await supabase
    .from("evaluations")
    .insert({
      group_id: groupId,
      session_id: sessionId,
      status: "draft",
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

/**
 * Setea (o crea) la nota grupal del grupo. Si no existía evaluación, la crea
 * en status 'draft'. Si ya existe, solo actualiza el campo.
 */
export async function setGroupScore(
  groupId: string,
  sessionId: string,
  score: number | null,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: existing, error: selError } = await supabase
    .from("evaluations")
    .select("id")
    .eq("group_id", groupId)
    .maybeSingle();
  if (selError) throw selError;

  if (existing) {
    const { error } = await supabase
      .from("evaluations")
      .update({ group_score: score })
      .eq("id", (existing as { id: string }).id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("evaluations").insert({
    group_id: groupId,
    session_id: sessionId,
    group_score: score,
    status: "draft",
  });
  if (error) throw error;
}

/** Cambia el estado y mantiene `published_at` coherente. */
export async function setEvaluationStatus(
  evaluationId: string,
  status: EvaluationStatus,
): Promise<void> {
  const supabase = getSupabaseClient();
  const updates: { status: EvaluationStatus; published_at: string | null } = {
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
  };
  const { error } = await supabase
    .from("evaluations")
    .update(updates)
    .eq("id", evaluationId);
  if (error) throw error;
}
