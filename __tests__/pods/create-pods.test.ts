import { describe, it, expect } from "vitest";
import {
  createPods,
  letterForPodIndex,
  type Student,
} from "@/lib/pods/create-pods";
import { POD_COLORS } from "@/lib/pods/pod-colors";

function makeStudents(n: number): Student[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `s-${(i + 1).toString().padStart(3, "0")}`,
    full_name: `Alumno ${i + 1}`,
  }));
}

describe("createPods — casos del SUPERPROMPT §5", () => {
  it("24 alumnos / 6 robots → 6 PODs de 4", () => {
    const pods = createPods({
      students: makeStudents(30),
      presentCount: 24,
      robotCount: 6,
    });
    expect(pods).toHaveLength(6);
    expect(pods.map((p) => p.students.length)).toEqual([4, 4, 4, 4, 4, 4]);
    expect(pods.flatMap((p) => p.students.map((s) => s.id))).toHaveLength(24);
  });

  it("22 alumnos / 6 robots → 4 PODs de 4 + 2 PODs de 3", () => {
    const pods = createPods({
      students: makeStudents(30),
      presentCount: 22,
      robotCount: 6,
    });
    expect(pods).toHaveLength(6);
    expect(pods.map((p) => p.students.length)).toEqual([4, 4, 4, 4, 3, 3]);
  });

  it("18 alumnos / 5 robots → 3 PODs de 4 + 2 PODs de 3", () => {
    const pods = createPods({
      students: makeStudents(20),
      presentCount: 18,
      robotCount: 5,
    });
    expect(pods).toHaveLength(5);
    expect(pods.map((p) => p.students.length)).toEqual([4, 4, 4, 3, 3]);
  });

  it("20 alumnos / 5 robots → 5 PODs de 4", () => {
    const pods = createPods({
      students: makeStudents(20),
      presentCount: 20,
      robotCount: 5,
    });
    expect(pods).toHaveLength(5);
    expect(pods.map((p) => p.students.length)).toEqual([4, 4, 4, 4, 4]);
  });

  it("1 alumno / 1 robot → 1 POD de 1", () => {
    const pods = createPods({
      students: makeStudents(1),
      presentCount: 1,
      robotCount: 1,
    });
    expect(pods).toHaveLength(1);
    expect(pods[0]?.students).toHaveLength(1);
    expect(pods[0]?.label).toBe("POD A");
  });

  it("0 alumnos / 1 robot → error", () => {
    expect(() =>
      createPods({
        students: [],
        presentCount: 0,
        robotCount: 1,
      }),
    ).toThrow(/más robots que alumnos/);
  });

  it("2 alumnos / 5 robots → error (más robots que alumnos)", () => {
    expect(() =>
      createPods({
        students: makeStudents(10),
        presentCount: 2,
        robotCount: 5,
      }),
    ).toThrow(/más robots que alumnos/);
  });
});

describe("createPods — comportamiento adicional", () => {
  it("toma los primeros presentCount alumnos como pool de presentes", () => {
    const students = makeStudents(10);
    const pods = createPods({ students, presentCount: 6, robotCount: 2 });
    const ids = pods.flatMap((p) => p.students.map((s) => s.id)).sort();
    expect(ids).toEqual([
      "s-001",
      "s-002",
      "s-003",
      "s-004",
      "s-005",
      "s-006",
    ]);
  });

  it("reparto entre PODs es aleatorio (no respeta orden de entrada)", () => {
    const students = makeStudents(24);
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const pods = createPods({ students, presentCount: 24, robotCount: 6 });
      const fingerprint = pods
        .map((p) => p.students.map((s) => s.id).join(","))
        .join("|");
      seen.add(fingerprint);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it("acepta un random() inyectable para reparto reproducible", () => {
    const students = makeStudents(8);
    const sequence = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7];
    let i = 0;
    const random = () => sequence[i++ % sequence.length] ?? 0;
    const a = createPods({ students, presentCount: 8, robotCount: 2, random });
    i = 0;
    const b = createPods({ students, presentCount: 8, robotCount: 2, random });
    expect(a.map((p) => p.students.map((s) => s.id))).toEqual(
      b.map((p) => p.students.map((s) => s.id)),
    );
  });

  it("asigna letras incrementales A, B, C…", () => {
    const pods = createPods({
      students: makeStudents(12),
      presentCount: 12,
      robotCount: 4,
    });
    expect(pods.map((p) => p.letter)).toEqual(["A", "B", "C", "D"]);
    expect(pods.map((p) => p.id)).toEqual([
      "pod-a",
      "pod-b",
      "pod-c",
      "pod-d",
    ]);
  });

  it("asigna colores de la paleta y los cicla más allá de 12", () => {
    const pods = createPods({
      students: makeStudents(14),
      presentCount: 14,
      robotCount: 14,
    });
    pods.forEach((p, i) => {
      expect(p.color.hex).toBe(POD_COLORS[i % POD_COLORS.length]!.hex);
    });
  });

  it("error si presentCount > students.length", () => {
    expect(() =>
      createPods({
        students: makeStudents(5),
        presentCount: 10,
        robotCount: 2,
      }),
    ).toThrow(/No hay tantos alumnos/);
  });

  it("respeta maxPerPod cuando se pasa explicitamente", () => {
    const pods = createPods({
      students: makeStudents(12),
      presentCount: 12,
      robotCount: 3,
      maxPerPod: 5,
    });
    pods.forEach((p) => expect(p.maxCapacity).toBe(5));
  });
});

describe("letterForPodIndex", () => {
  it("0..25 devuelve A..Z", () => {
    expect(letterForPodIndex(0)).toBe("A");
    expect(letterForPodIndex(25)).toBe("Z");
  });

  it("26..27 devuelve AA, AB", () => {
    expect(letterForPodIndex(26)).toBe("AA");
    expect(letterForPodIndex(27)).toBe("AB");
  });
});
