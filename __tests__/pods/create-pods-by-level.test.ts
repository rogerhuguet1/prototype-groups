import { describe, it, expect } from "vitest";
import {
  createPodsByLevel,
  createPodsByProgress,
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

describe("createPodsByProgress", () => {
  it("agrupa primero por avance en el curso (unidad alcanzada)", () => {
    const students = makeStudents(9);
    // alumnos 1-3 en unit 1, 4-6 en unit 2, 7-9 en unit 3
    const progressFn = (id: string): number => {
      const n = parseInt(id.slice(2), 10);
      if (n <= 3) return 1;
      if (n <= 6) return 2;
      return 3;
    };
    const { pods } = createPodsByProgress({
      students,
      presentCount: 9,
      robotCount: 3,
      progressFn,
      scoreFn: () => 0,
    });
    expect(pods).toHaveLength(3);
    pods.forEach((pod) => {
      const progresses = pod.students.map((s) => progressFn(s.id));
      expect(new Set(progresses).size).toBe(1);
    });
    expect(progressFn(pods[0]!.students[0]!.id)).toBeGreaterThan(
      progressFn(pods[2]!.students[0]!.id),
    );
  });

  it("dentro del mismo nivel de progreso, usa score como tiebreaker", () => {
    const students = makeStudents(6);
    const progressFn = () => 1;
    const scoreFn = (id: string) =>
      parseInt(id.slice(2), 10);
    const { pods } = createPodsByProgress({
      students,
      presentCount: 6,
      robotCount: 2,
      maxPerPod: 4,
      progressFn,
      scoreFn,
    });
    const firstScores = pods[0]!.students.map((s) => scoreFn(s.id));
    const secondScores = pods[1]!.students.map((s) => scoreFn(s.id));
    expect(Math.min(...firstScores)).toBeGreaterThan(
      Math.max(...secondScores),
    );
  });

  it("misma seed → output identico", () => {
    const students = makeStudents(9);
    const progressFn = (id: string): number => {
      const n = parseInt(id.slice(2), 10);
      return n <= 3 ? 1 : n <= 6 ? 2 : 3;
    };
    const seed = "seed-by-progress";
    const a = createPodsByProgress({
      students,
      presentCount: 9,
      robotCount: 3,
      progressFn,
      scoreFn: () => 0,
      seed,
    });
    const b = createPodsByProgress({
      students,
      presentCount: 9,
      robotCount: 3,
      progressFn,
      scoreFn: () => 0,
      seed,
    });
    expect(JSON.stringify(a.pods)).toBe(JSON.stringify(b.pods));
  });

  it("error si robotCount > 15", () => {
    expect(() =>
      createPodsByProgress({
        students: makeStudents(40),
        presentCount: 30,
        robotCount: 16,
        progressFn: () => 0,
        scoreFn: () => 0,
      }),
    ).toThrow(/Máximo 15 grupos/);
  });
});

describe("createPodsByLevel — respeta lockedStudentIds + currentPods", () => {
  it("leveled: alumno bloqueado en pod-1 se mantiene en pod-1", () => {
    const students = makeStudents(8);
    const initial = createPodsByLevel({
      students,
      presentCount: 8,
      robotCount: 2,
      mode: "leveled",
      scoreFn: linearScore,
      maxPerPod: 4,
      seed: "init",
    }).pods;
    // Bloqueamos al alumno con menor score (s-001) y forzamos a que esté en pod-1.
    const lockedId = "s-001";
    const seededPods = initial.map((p) => ({
      ...p,
      students:
        p.id === "pod-1"
          ? [{ id: lockedId, full_name: "Alumno 1" }, ...p.students.filter((s) => s.id !== lockedId)]
          : p.students.filter((s) => s.id !== lockedId),
    }));

    const result = createPodsByLevel({
      students,
      presentCount: 8,
      robotCount: 2,
      mode: "leveled",
      scoreFn: linearScore,
      maxPerPod: 4,
      seed: "regroup",
      lockedStudentIds: [lockedId],
      currentPods: seededPods,
    });

    const pod1 = result.pods.find((p) => p.id === "pod-1")!;
    expect(pod1.students.some((s) => s.id === lockedId)).toBe(true);
    expect(result.pods.flatMap((p) => p.students.map((s) => s.id)).sort()).toEqual(
      students.map((s) => s.id).sort(),
    );
  });

  it("mixed: alumnos bloqueados se quedan, los free se reparten en zigzag", () => {
    const students = makeStudents(8);
    const initial = createPodsByLevel({
      students,
      presentCount: 8,
      robotCount: 2,
      mode: "mixed",
      scoreFn: linearScore,
      maxPerPod: 4,
      seed: "init",
    }).pods;
    const lockedId = "s-005";
    const seededPods = initial.map((p) => ({
      ...p,
      students:
        p.id === "pod-2"
          ? [{ id: lockedId, full_name: "Alumno 5" }, ...p.students.filter((s) => s.id !== lockedId)]
          : p.students.filter((s) => s.id !== lockedId),
    }));

    const result = createPodsByLevel({
      students,
      presentCount: 8,
      robotCount: 2,
      mode: "mixed",
      scoreFn: linearScore,
      maxPerPod: 4,
      seed: "regroup",
      lockedStudentIds: [lockedId],
      currentPods: seededPods,
    });

    const pod2 = result.pods.find((p) => p.id === "pod-2")!;
    expect(pod2.students.some((s) => s.id === lockedId)).toBe(true);
    expect(result.pods.flatMap((p) => p.students.map((s) => s.id)).sort()).toEqual(
      students.map((s) => s.id).sort(),
    );
  });

  it("respeta capacidad: nunca excede maxPerPod incluso con locks", () => {
    const students = makeStudents(8);
    const initial = createPodsByLevel({
      students,
      presentCount: 8,
      robotCount: 2,
      mode: "leveled",
      scoreFn: linearScore,
      maxPerPod: 4,
      seed: "init",
    }).pods;
    // Bloqueamos a 4 alumnos del pod-1 (lleno).
    const lockedIds = initial.find((p) => p.id === "pod-1")!.students.map((s) => s.id);
    const result = createPodsByLevel({
      students,
      presentCount: 8,
      robotCount: 2,
      mode: "leveled",
      scoreFn: linearScore,
      maxPerPod: 4,
      seed: "regroup",
      lockedStudentIds: lockedIds,
      currentPods: initial,
    });
    for (const pod of result.pods) {
      expect(pod.students.length).toBeLessThanOrEqual(4);
    }
  });

  it("pods generados tienen evaluation: null", () => {
    const students = makeStudents(8);
    const { pods } = createPodsByLevel({
      students,
      presentCount: 8,
      robotCount: 2,
      mode: "leveled",
      scoreFn: linearScore,
      maxPerPod: 4,
    });
    for (const pod of pods) {
      expect(pod.evaluation).toBeNull();
    }
  });
});
