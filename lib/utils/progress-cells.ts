export type ProgressCell =
  | { kind: "empty" }
  | { kind: "completed" }
  | { kind: "failed" }
  | { kind: "score"; value: number; band: ScoreBand };

export type ScoreBand =
  | "insuficiente"
  | "suficiente"
  | "bien"
  | "notable"
  | "excelente";

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function bandFor(value: number): ScoreBand {
  if (value < 5) return "insuficiente";
  if (value < 6) return "suficiente";
  if (value < 7) return "bien";
  if (value < 9) return "notable";
  return "excelente";
}

export function progressCellFor(
  studentId: string,
  columnIndex: number,
): ProgressCell {
  const seed = hash(`${studentId}:${columnIndex}`);
  const bucket = seed % 100;

  if (bucket < 12) return { kind: "empty" };
  if (bucket < 22) return { kind: "completed" };
  if (bucket < 28) return { kind: "failed" };

  const value = (seed % 101) / 10;
  const rounded = Math.round(value * 10) / 10;
  return { kind: "score", value: rounded, band: bandFor(rounded) };
}

export const BAND_STYLES: Record<
  ScoreBand,
  { bg: string; text: string; border: string }
> = {
  insuficiente: {
    bg: "bg-grade-fail",
    text: "text-white",
    border: "border-grade-fail",
  },
  suficiente: {
    bg: "bg-grade-pass",
    text: "text-white",
    border: "border-grade-pass",
  },
  bien: {
    bg: "bg-grade-good",
    text: "text-c360-text",
    border: "border-grade-good",
  },
  notable: {
    bg: "bg-grade-great",
    text: "text-white",
    border: "border-grade-great",
  },
  excelente: {
    bg: "bg-grade-excellent",
    text: "text-white",
    border: "border-grade-excellent",
  },
};

export const BAND_LABELS: Record<ScoreBand, string> = {
  insuficiente: "Insuficiente (0-4,9)",
  suficiente: "Suficiente (5-5,9)",
  bien: "Bien (6-6,9)",
  notable: "Notable (7-8,9)",
  excelente: "Excelente (9-10)",
};
