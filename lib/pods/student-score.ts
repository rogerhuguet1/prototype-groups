import { progressCellFor } from "@/lib/utils/progress-cells";

const UNIT_ONE_COLUMN_INDICES = [0, 1, 2, 3] as const;

const COMPLETED_SCORE = 8;
const FAILED_SCORE = 3;

export function getStudentScore(studentId: string): number {
  let total = 0;
  let count = 0;
  for (const idx of UNIT_ONE_COLUMN_INDICES) {
    const cell = progressCellFor(studentId, idx);
    if (cell.kind === "empty") continue;
    if (cell.kind === "completed") {
      total += COMPLETED_SCORE;
    } else if (cell.kind === "failed") {
      total += FAILED_SCORE;
    } else {
      total += cell.value;
    }
    count += 1;
  }
  return count > 0 ? total / count : 0;
}

export function isUnitOneComplete(studentIds: readonly string[]): boolean {
  if (studentIds.length === 0) return false;
  const required = UNIT_ONE_COLUMN_INDICES.length;
  let totalCells = 0;
  let nonEmpty = 0;
  for (const id of studentIds) {
    for (const idx of UNIT_ONE_COLUMN_INDICES) {
      totalCells += 1;
      const cell = progressCellFor(id, idx);
      if (cell.kind !== "empty") nonEmpty += 1;
    }
  }
  return totalCells > 0 && nonEmpty / totalCells >= 0.7 && required > 0;
}
