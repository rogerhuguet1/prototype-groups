import { z } from "zod";
import type { Evaluation, ScoreBand, Student } from "./types";
import {
  SCORE_BAND_HIGH_MIN,
  SCORE_BAND_MEDIUM_MIN,
  SCORE_MAX,
  SCORE_MIN,
} from "./constants";

/** Schema Zod compartible con futuras Edge Functions. */
export const ScoreSchema = z
  .number()
  .min(SCORE_MIN)
  .max(SCORE_MAX)
  .multipleOf(0.01);

/** Devuelve la banda semántica del semáforo de notas. */
export function scoreBand(score: number | null | undefined): ScoreBand {
  if (score === null || score === undefined || Number.isNaN(score)) return "none";
  if (score >= SCORE_BAND_HIGH_MIN) return "high";
  if (score >= SCORE_BAND_MEDIUM_MIN) return "medium";
  return "low";
}

/**
 * Nota efectiva de un alumno dentro de un grupo:
 *   override individual ?? nota grupal
 */
export function effectiveScore(
  evaluation: Evaluation | undefined,
  studentId: string,
): number | null {
  if (!evaluation) return null;
  const override = evaluation.individualOverrides[studentId];
  if (override !== undefined) return override;
  return evaluation.groupScore;
}

/**
 * Media efectiva del grupo: promedio de las notas efectivas de cada alumno.
 * Devuelve `null` si ningún alumno tiene nota.
 */
export function panelAverage(
  evaluation: Evaluation | undefined,
  studentIds: readonly string[],
): number | null {
  if (!evaluation || studentIds.length === 0) return null;
  const scores = studentIds
    .map((id) => effectiveScore(evaluation, id))
    .filter((s): s is number => s !== null);
  if (scores.length === 0) return null;
  const sum = scores.reduce((acc, n) => acc + n, 0);
  return sum / scores.length;
}

/** Media de baseScore para mostrar nivel orientativo del grupo antes de evaluar. */
export function panelBaseAverage(students: readonly Student[]): number | null {
  const withScore = students.filter(
    (s): s is Student & { baseScore: number } => typeof s.baseScore === "number",
  );
  if (withScore.length === 0) return null;
  return withScore.reduce((acc, s) => acc + s.baseScore, 0) / withScore.length;
}

export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(score)) return "—";
  return score.toFixed(1);
}

export function isValidScore(value: number): boolean {
  return ScoreSchema.safeParse(value).success;
}

/**
 * Clases Tailwind por banda del semáforo. Centralizadas aquí para que el
 * sistema cromático sea coherente entre sidebar, dots dentro del panel,
 * panel de detalle y listado individual.
 */
export const SCORE_BAND_CLASSES: Record<
  ScoreBand,
  { bg: string; border: string; text: string; ring: string }
> = {
  high: {
    bg: "bg-score-high-bg",
    border: "border-score-high-border",
    text: "text-score-high-text",
    ring: "ring-score-high-border",
  },
  medium: {
    bg: "bg-score-medium-bg",
    border: "border-score-medium-border",
    text: "text-score-medium-text",
    ring: "ring-score-medium-border",
  },
  low: {
    bg: "bg-score-low-bg",
    border: "border-score-low-border",
    text: "text-score-low-text",
    ring: "ring-score-low-border",
  },
  none: {
    bg: "bg-score-empty-bg",
    border: "border-score-empty-border",
    text: "text-score-empty-text",
    ring: "ring-score-empty-border",
  },
};

/** Clases listas para el borde del círculo del panel según su media. */
export function panelRingClasses(score: number | null | undefined): string {
  return SCORE_BAND_CLASSES[scoreBand(score)].border;
}
