import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * Crea una copia archivada de la sesión: nueva `group_sessions` con
 * `status='archived'` + duplicado en cascada de grupos, miembros,
 * evaluaciones y scores individuales.
 *
 * No es atómico (cliente Supabase, sin transacción). Si falla a mitad
 * queda un snapshot parcial. Aceptable para prototipo.
 *
 * Devuelve el id de la nueva sesión archivada.
 */
export async function archiveSession(
  sourceSessionId: string,
  name: string,
): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("El nombre del snapshot no puede estar vacío.");
  const supabase = getSupabaseClient();

  // 1) Sesión origen
  const { data: source, error: srcErr } = await supabase
    .from("group_sessions")
    .select("class_id, max_group_size, min_group_size")
    .eq("id", sourceSessionId)
    .single();
  if (srcErr) throw srcErr;

  // 2) Sesión destino
  const { data: newSession, error: insSesErr } = await supabase
    .from("group_sessions")
    .insert({
      name: trimmed,
      class_id: (source as { class_id: string | null }).class_id,
      status: "archived",
      max_group_size: (source as { max_group_size: number | null })
        .max_group_size,
      min_group_size: (source as { min_group_size: number | null })
        .min_group_size,
    })
    .select("id")
    .single();
  if (insSesErr) throw insSesErr;
  const newSessionId = (newSession as { id: string }).id;

  // 3) Grupos origen
  const { data: srcGroups, error: gErr } = await supabase
    .from("groups")
    .select("id, name, color")
    .eq("session_id", sourceSessionId);
  if (gErr) throw gErr;

  const groupIdMap = new Map<string, string>();
  type SrcGroup = { id: string; name: string; color: string | null };
  const srcGroupsList = (srcGroups ?? []) as SrcGroup[];

  if (srcGroupsList.length > 0) {
    const rows = srcGroupsList.map((g) => ({
      session_id: newSessionId,
      name: g.name,
      color: g.color,
    }));
    const { data: inserted, error: insGErr } = await supabase
      .from("groups")
      .insert(rows)
      .select("id");
    if (insGErr) throw insGErr;
    const insertedList = (inserted ?? []) as { id: string }[];
    for (let i = 0; i < srcGroupsList.length; i++) {
      const oldId = srcGroupsList[i]?.id;
      const newId = insertedList[i]?.id;
      if (oldId && newId) groupIdMap.set(oldId, newId);
    }
  }

  const oldGroupIds = Array.from(groupIdMap.keys());

  // 4) Miembros
  if (oldGroupIds.length > 0) {
    const { data: srcMembers, error: mErr } = await supabase
      .from("group_members")
      .select("group_id, student_id, is_locked, is_absent")
      .in("group_id", oldGroupIds);
    if (mErr) throw mErr;
    type SrcMember = {
      group_id: string | null;
      student_id: string | null;
      is_locked: boolean | null;
      is_absent: boolean | null;
    };
    const srcMembersList = (srcMembers ?? []) as SrcMember[];
    const memberRows = srcMembersList
      .filter((m) => m.group_id && groupIdMap.has(m.group_id))
      .map((m) => ({
        group_id: groupIdMap.get(m.group_id as string),
        student_id: m.student_id,
        is_locked: m.is_locked,
        is_absent: m.is_absent,
      }));
    if (memberRows.length > 0) {
      const { error: insMErr } = await supabase
        .from("group_members")
        .insert(memberRows);
      if (insMErr) throw insMErr;
    }
  }

  // 5) Evaluaciones
  const evalIdMap = new Map<string, string>();
  if (oldGroupIds.length > 0) {
    const { data: srcEvals, error: eErr } = await supabase
      .from("evaluations")
      .select("id, group_id, group_score, status, notes")
      .in("group_id", oldGroupIds);
    if (eErr) throw eErr;
    type SrcEval = {
      id: string;
      group_id: string | null;
      group_score: number | null;
      status: string | null;
      notes: string | null;
    };
    const srcEvalsList = (srcEvals ?? []) as SrcEval[];
    const evalRows = srcEvalsList
      .filter((e) => e.group_id && groupIdMap.has(e.group_id))
      .map((e) => ({
        group_id: groupIdMap.get(e.group_id as string),
        session_id: newSessionId,
        group_score: e.group_score,
        status: e.status,
        notes: e.notes,
      }));
    if (evalRows.length > 0) {
      const { data: insertedEvals, error: insEErr } = await supabase
        .from("evaluations")
        .insert(evalRows)
        .select("id, group_id");
      if (insEErr) throw insEErr;
      const insertedEvalsList = (insertedEvals ?? []) as {
        id: string;
        group_id: string | null;
      }[];
      // Mapeo old eval id -> new eval id, vía group_id.
      for (const oldEval of srcEvalsList) {
        if (!oldEval.group_id) continue;
        const newGroupId = groupIdMap.get(oldEval.group_id);
        if (!newGroupId) continue;
        const newEval = insertedEvalsList.find(
          (ne) => ne.group_id === newGroupId,
        );
        if (newEval) evalIdMap.set(oldEval.id, newEval.id);
      }
    }
  }

  // 6) Individual scores
  const oldEvalIds = Array.from(evalIdMap.keys());
  if (oldEvalIds.length > 0) {
    const { data: srcScores, error: sErr } = await supabase
      .from("individual_scores")
      .select("evaluation_id, student_id, score_override, notes")
      .in("evaluation_id", oldEvalIds);
    if (sErr) throw sErr;
    type SrcScore = {
      evaluation_id: string | null;
      student_id: string | null;
      score_override: number | null;
      notes: string | null;
    };
    const srcScoresList = (srcScores ?? []) as SrcScore[];
    const scoreRows = srcScoresList
      .filter((s) => s.evaluation_id && evalIdMap.has(s.evaluation_id))
      .map((s) => ({
        evaluation_id: evalIdMap.get(s.evaluation_id as string),
        student_id: s.student_id,
        score_override: s.score_override,
        notes: s.notes,
      }));
    if (scoreRows.length > 0) {
      const { error: insSErr } = await supabase
        .from("individual_scores")
        .insert(scoreRows);
      if (insSErr) throw insSErr;
    }
  }

  return newSessionId;
}
