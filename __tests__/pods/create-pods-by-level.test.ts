import { describe, it, expect } from "vitest";
import {
  createPodsByLevel,
  type Student,
} from "@/lib/pods/create-pods";

function makeStudents(n: number): Student[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `s-${(i + 1).toString().padStart(3, "0")}`,
    full_name: `Alumno ${i + 1}`,
  }));
}

const linearScore = (id: string): number => {
  const num = parseInt(id.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(num) ? num : 0;
};

describe("createPodsByLevel — modo leveled", () => {
  it("agrupa los top juntos y los bottom juntos", () => {
    const students = makeStudents(12);
    const { pods } = createPodsByLevel({
      students,
      presentCount: 12,
      robotCount: 3,
      mode: "leveled",
      scoreFn: linearScore,
    });
    expect(pods).toHaveLength(3);
    const idsByPod = pods.map((p) =>
      p.students.map((s) => parseInt(s.id.slice(2), 10)),
    );
    expect(Math.min(...idsByPod[0]!)).toBeGreaterThan(
      Math.max(...idsByPod[1]!),
    );
    expect(Math.min(...idsByPod[1]!)).toBeGreaterThan(
      Math.max(...idsByPod[2]!),
    );
  });

  it("respeta tamaños equilibrados con resto", () => {
    const students = makeStudents(11);
    const { pods } = createPodsByLevel({
      students,
      presentCount: 11,
      robotCount: 3,
      mode: "leveled",
      scoreFn: linearScore,
      maxPerPod: 4,
    });
    expect(pods.map((p) => p.students.length).sort()).toEqual([3, 4, 4]);
  });
});

describe("createPodsByLevel — modo mixed", () => {
  it("equilibra niveles entre grupos (rango similar en cada uno)", () => {
    const students = makeStudents(12);
    const { pods } = createPodsByLevel({
      students,
      presentCount: 12,
      robotCount: 3,
      mode: "mixed",
      scoreFn: linearScore,
    });
    expect(pods).toHaveLength(3);
    const sums = pods.map((p) =>
      p.students.reduce((acc, s) => acc + linearScore(s.id), 0),
    );
    const max = Math.max(...sums);
    const min = Math.min(...sums);
    expect(max - min).toBeLessThanOrEqual(3);
  });

  it("cada grupo contiene al menos un alumno con score alto Y uno bajo (heterogeneo)", () => {
    const students = makeStudents(12);
    const { pods } = createPodsByLevel({
      students,
      presentCount: 12,
      robotCount: 3,
      mode: "mixed",
      scoreFn: linearScore,
    });
    pods.forEach((p) => {
      const scores = p.students.map((s) => linearScore(s.id));
      const top = Math.max(...scores);
      const bottom = Math.min(...scores);
      expect(top - bottom).toBeGreaterThanOrEqual(4);
    });
  });
});

describe("createPodsByLevel — comportamiento general", () => {
  it("misma seed → output identico", () => {
    const students = makeStudents(12);
    const seed = "preset-seed-test";
    const a = createPodsByLevel({
      students,
      presentCount: 12,
      robotCount: 3,
      mode: "mixed",
      scoreFn: linearScore,
      seed,
    });
    const b = createPodsByLevel({
      students,
      presentCount: 12,
      robotCount: 3,
      mode: "mixed",
      scoreFn: linearScore,
      seed,
    });
    expect(JSON.stringify(a.pods)).toBe(JSON.stringify(b.pods));
  });

  it("error si robotCount > presentCount", () => {
    expect(() =>
      createPodsByLevel({
        students: makeStudents(3),
        presentCount: 3,
        robotCount: 5,
        mode: "leveled",
        scoreFn: linearScore,
      }),
    ).toThrow(/más robots que alumnos/);
  });

  it("error si robotCount > 15", () => {
    expect(() =>
      createPodsByLevel({
        students: makeStudents(40),
        presentCount: 30,
        robotCount: 16,
        mode: "leveled",
        scoreFn: linearScore,
      }),
    ).toThrow(/Máximo 15 grupos/);
  });

  it("emojis y colores unicos por llamada", () => {
    const students = makeStudents(20);
    const { pods } = createPodsByLevel({
      students,
      presentCount: 20,
      robotCount: 5,
      mode: "leveled",
      scoreFn: linearScore,
    });
    expect(new Set(pods.map((p) => p.emoji)).size).toBe(5);
    expect(new Set(pods.map((p) => p.color.hex)).size).toBe(5);
  });
});
