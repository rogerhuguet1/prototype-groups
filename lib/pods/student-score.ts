import { progressCellFor } from "@/lib/utils/progress-cells";

const UNIT_ONE_COLUMN_INDICES = [0, 1, 2, 3] as const;
const NUM_UNITS = 6;
const COLS_PER_UNIT = 4;
const TOTAL_COLS = NUM_UNITS * COLS_PER_UNIT;

const COMPLETED_SCORE = 8;
const FAILED_SCORE = 3;

function valueOf(studentId: string, idx: number): number | null {
  const cell = progressCellFor(studentId, idx);
  if (cell.kind === "empty") return null;
  if (cell.kind === "completed") return COMPLETED_SCORE;
  if (cell.kind === "failed") return FAILED_SCORE;
  return cell.value;
}

export function getStudentScore(studentId: string): number {
  let total = 0;
  let count = 0;
  for (const idx of UNIT_ONE_COLUMN_INDICES) {
    const v = valueOf(studentId, idx);
    if (v === null) continue;
    total += v;
    count += 1;
  }
  return count > 0 ? total / count : 0;
}

export function getStudentOverallScore(studentId: string): number {
  let total = 0;
  let count = 0;
  for (let idx = 0; idx < TOTAL_COLS; idx++) {
    const v = valueOf(studentId, idx);
    if (v === null) continue;
    total += v;
    count += 1;
  }
  return count > 0 ? total / count : 0;
}

export function getStudentProgress(studentId: string): number {
  for (let unit = NUM_UNITS; unit >= 1; unit--) {
    const start = (unit - 1) * COLS_PER_UNIT;
    for (let i = start; i < start + COLS_PER_UNIT; i++) {
      const cell = progressCellFor(studentId, i);
      if (cell.kind !== "empty") return unit;
    }
  }
  return 0;
}

export function isUnitOneComplete(studentIds: readonly string[]): boolean {
  if (studentIds.length === 0) return false;
  let totalCells = 0;
  let nonEmpty = 0;
  for (const id of studentIds) {
    for (const idx of UNIT_ONE_COLUMN_INDICES) {
      totalCells += 1;
      const cell = progressCellFor(id, idx);
      if (cell.kind !== "empty") nonEmpty += 1;
    }
  }
  return totalCells > 0 && nonEmpty / totalCells >= 0.7;
}
