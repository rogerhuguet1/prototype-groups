import { describe, it, expect } from "vitest";
import {
  getCoOccurrenceMatrix,
  getPairCount,
} from "@/lib/pods/co-occurrence";
import type { HistoryEntry } from "@/types/history";
import type { Pod } from "@/lib/pods/create-pods";

function pod(id: string, studentIds: string[]): Pod {
  return {
    id,
    emoji: "🤖",
    emojiLabel: "Robot",
    color: { hex: "#000000", name: "test", textOn: "white" },
    students: studentIds.map((sid) => ({ id: sid, full_name: sid })),
    maxCapacity: 4,
    isLocked: false,
  };
}

function entry(id: string, pods: Pod[]): HistoryEntry {
  return {
    id,
    timestamp: new Date().toISOString(),
    classId: null,
    presentStudents: pods.reduce((acc, p) => acc + p.students.length, 0),
    robotCount: pods.length,
    seed: id,
    pods,
    isFavorite: false,
    evaluations: [],
    evaluatedAt: null,
    lockedStudentIds: [],
  };
}

describe("getCoOccurrenceMatrix", () => {
  it("0 entradas → matriz vacía", () => {
    const matrix = getCoOccurrenceMatrix([]);
    expect(matrix.size).toBe(0);
  });

  it("1 entrada con 1 grupo de 3 alumnos → 3 pares con count=1 (simetricos)", () => {
    const matrix = getCoOccurrenceMatrix([
      entry("e1", [pod("p-1", ["A", "B", "C"])]),
    ]);
    expect(getPairCount(matrix, "A", "B")).toBe(1);
    expect(getPairCount(matrix, "B", "A")).toBe(1);
    expect(getPairCount(matrix, "A", "C")).toBe(1);
    expect(getPairCount(matrix, "B", "C")).toBe(1);
    expect(getPairCount(matrix, "C", "A")).toBe(1);
  });

  it("3 entradas con A y B siempre juntos → matriz[A][B] = 3", () => {
    const matrix = getCoOccurrenceMatrix([
      entry("e1", [pod("p-1", ["A", "B", "X"])]),
      entry("e2", [pod("p-1", ["A", "B", "Y"])]),
      entry("e3", [pod("p-1", ["A", "B", "Z"])]),
    ]);
    expect(getPairCount(matrix, "A", "B")).toBe(3);
    expect(getPairCount(matrix, "B", "A")).toBe(3);
  });

  it("alumnos en grupos distintos no cuentan como coincidencia", () => {
    const matrix = getCoOccurrenceMatrix([
      entry("e1", [pod("p-1", ["A", "B"]), pod("p-2", ["C", "D"])]),
    ]);
    expect(getPairCount(matrix, "A", "C")).toBe(0);
    expect(getPairCount(matrix, "A", "B")).toBe(1);
    expect(getPairCount(matrix, "C", "D")).toBe(1);
  });

  it("entrada con grupos vacios no rompe", () => {
    const matrix = getCoOccurrenceMatrix([
      entry("e1", [pod("p-1", []), pod("p-2", ["A"])]),
    ]);
    expect(matrix.size).toBe(0);
  });

  it("inmutabilidad: el array de entrada no se muta", () => {
    const input = [entry("e1", [pod("p-1", ["A", "B", "C"])])];
    const snapshot = JSON.stringify(input);
    getCoOccurrenceMatrix(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it("mezcla de entradas con pares repetidos y nuevos", () => {
    const matrix = getCoOccurrenceMatrix([
      entry("e1", [pod("p-1", ["A", "B"])]),
      entry("e2", [pod("p-1", ["A", "B"])]),
      entry("e3", [pod("p-1", ["B", "C"])]),
    ]);
    expect(getPairCount(matrix, "A", "B")).toBe(2);
    expect(getPairCount(matrix, "B", "C")).toBe(1);
    expect(getPairCount(matrix, "A", "C")).toBe(0);
  });
});
