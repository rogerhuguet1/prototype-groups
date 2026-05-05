import type { Panel, PanelMembership } from "@/lib/domain/types";

interface DistributeArgs {
  unassignedStudentIds: readonly string[];
  panels: readonly Panel[];
  /** Conteo actual de miembros por panelId. */
  currentCount: Record<string, number>;
}

export interface DistributeResult {
  newMemberships: PanelMembership[];
  /** IDs que no han cabido. */
  leftover: string[];
}

/**
 * Reparto round-robin simple respetando capacidad.
 *
 * No es la "distribución equilibrada por terciles de rendimiento"
 * (Edge Function `auto_balance`, FASE 4 según CLAUDE.md). Para Fase 0
 * basta con repartir uniformemente sin tener en cuenta nivel.
 */
export function distributeRoundRobin({
  unassignedStudentIds,
  panels,
  currentCount,
}: DistributeArgs): DistributeResult {
  const newMemberships: PanelMembership[] = [];
  const leftover: string[] = [];

  if (panels.length === 0) {
    return { newMemberships, leftover: [...unassignedStudentIds] };
  }

  const ordered = [...panels].sort((a, b) => a.sortOrder - b.sortOrder);
  const counts = { ...currentCount };

  for (const studentId of unassignedStudentIds) {
    const target = pickPanelWithSpace(ordered, counts);
    if (!target) {
      leftover.push(studentId);
      continue;
    }
    counts[target.id] = (counts[target.id] ?? 0) + 1;
    newMemberships.push({
      panelId: target.id,
      studentId,
      isLocked: false,
      isAbsent: false,
    });
  }

  return { newMemberships, leftover };
}

function pickPanelWithSpace(
  panels: readonly Panel[],
  counts: Record<string, number>,
): Panel | null {
  let best: Panel | null = null;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const panel of panels) {
    const count = counts[panel.id] ?? 0;
    if (count >= panel.capacity) continue;
    if (count < bestCount) {
      best = panel;
      bestCount = count;
    }
  }
  return best;
}
