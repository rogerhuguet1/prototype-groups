import type { EvaluationStatus } from "./types";

/** Tamaños por defecto de la sesión, alineados con vg_sessions defaults. */
export const DEFAULT_MIN_GROUP_SIZE = 3;
export const DEFAULT_MAX_GROUP_SIZE = 5;
export const HARD_MAX_GROUP_SIZE = 10;
export const HARD_MIN_GROUP_SIZE = 1;

export const SCORE_MIN = 0;
export const SCORE_MAX = 10;

/** Transiciones permitidas entre estados de evaluación. */
export const ALLOWED_EVAL_TRANSITIONS: Record<EvaluationStatus, EvaluationStatus[]> = {
  pending: ["draft"],
  draft: ["pending", "published"],
  published: ["draft", "locked"],
  locked: [],
};

export const EVAL_STATUS_LABEL: Record<EvaluationStatus, string> = {
  pending: "Pendiente",
  draft: "Borrador",
  published: "Publicada",
  locked: "Bloqueada",
};

/** Umbrales del semáforo de notas (CLAUDE.md §12). */
export const SCORE_BAND_HIGH_MIN = 7.0;
export const SCORE_BAND_MEDIUM_MIN = 5.0;
