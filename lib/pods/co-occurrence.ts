import type { HistoryEntry } from "@/types/history";

export type CoOccurrenceMatrix = Map<string, Map<string, number>>;

export function getCoOccurrenceMatrix(
  history: readonly HistoryEntry[],
): CoOccurrenceMatrix {
  const matrix: CoOccurrenceMatrix = new Map();
  for (const entry of history) {
    for (const pod of entry.pods) {
      const ids = pod.students.map((s) => s.id);
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = ids[i] as string;
          const b = ids[j] as string;
          incrementPair(matrix, a, b);
          incrementPair(matrix, b, a);
        }
      }
    }
  }
  return matrix;
}

export function getPairCount(
  matrix: CoOccurrenceMatrix,
  a: string,
  b: string,
): number {
  return matrix.get(a)?.get(b) ?? 0;
}

function incrementPair(
  matrix: CoOccurrenceMatrix,
  a: string,
  b: string,
): void {
  let row = matrix.get(a);
  if (!row) {
    row = new Map();
    matrix.set(a, row);
  }
  row.set(b, (row.get(b) ?? 0) + 1);
}
