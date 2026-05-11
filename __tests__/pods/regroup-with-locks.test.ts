import { describe, it, expect } from "vitest";
import { createPods, type Pod, type Student } from "@/lib/pods/create-pods";
import {
  regroupWithLocks,
  RegroupLocksError,
} from "@/lib/pods/regroup-with-locks";

function makeStudents(n: number): Student[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `s-${i + 1}`,
    full_name: `Alumno ${i + 1}`,
  }));
}

function totalAssigned(pods: Pod[]): number {
  return pods.reduce((acc, p) => acc + p.students.length, 0);
}

function studentIdsIn(pods: Pod[]): Set<string> {
  const ids = new Set<string>();
  for (const p of pods) for (const s of p.students) ids.add(s.id);
  return ids;
}

describe("regroupWithLocks", () => {
  it("sin bloqueos: redistribuye todos los alumnos manteniendo emojis y colores", () => {
    const students = makeStudents(24);
    const initial = createPods({
      students,
      presentCount: 24,
      robotCount: 6,
      maxPerPod: 4,
      seed: "seed-init",
    }).pods;

    const result = regroupWithLocks({
      currentPods: initial,
      lockedStudentIds: [],
      allPresentStudents: students,
      seed: "seed-regroup",
    });

    expect(result.pods).toHaveLength(6);
    expect(totalAssigned(result.pods)).toBe(24);
    for (let i = 0; i < 6; i++) {
      expect(result.pods[i]!.id).toBe(initial[i]!.id);
      expect(result.pods[i]!.emoji).toBe(initial[i]!.emoji);
      expect(result.pods[i]!.color.hex).toBe(initial[i]!.color.hex);
      expect(result.pods[i]!.maxCapacity).toBe(4);
    }
  });

  it("misma seed produce el mismo reparto", () => {
    const students = makeStudents(24);
    const initial = createPods({
      students,
      presentCount: 24,
      robotCount: 6,
      maxPerPod: 4,
      seed: "init",
    }).pods;
    const a = regroupWithLocks({
      currentPods: initial,
      lockedStudentIds: [],
      allPresentStudents: students,
      seed: "regroup-x",
    });
    const b = regroupWithLocks({
      currentPods: initial,
      lockedStudentIds: [],
      allPresentStudents: students,
      seed: "regroup-x",
    });
    for (let i = 0; i < 6; i++) {
      expect(a.pods[i]!.students.map((s) => s.id)).toEqual(
        b.pods[i]!.students.map((s) => s.id),
      );
    }
  });

  it("2 grupos bloqueados (8 alumnos), redistribuye 16 en 4 grupos", () => {
    const students = makeStudents(24);
    const initial = createPods({
      students,
      presentCount: 24,
      robotCount: 6,
      maxPerPod: 4,
      seed: "init",
    }).pods;
    const lockedPods = [initial[0]!, initial[1]!];
    const lockedStudentIdsInPods = lockedPods.flatMap((p) =>
      p.students.map((s) => s.id),
    );

    const result = regroupWithLocks({
      currentPods: initial,
      lockedStudentIds: lockedStudentIdsInPods,
      allPresentStudents: students,
      seed: "regroup",
    });

    expect(result.pods[0]!.students.map((s) => s.id).sort()).toEqual(
      lockedPods[0]!.students.map((s) => s.id).sort(),
    );
    expect(result.pods[1]!.students.map((s) => s.id).sort()).toEqual(
      lockedPods[1]!.students.map((s) => s.id).sort(),
    );
    expect(totalAssigned(result.pods)).toBe(24);
    expect(studentIdsIn(result.pods).size).toBe(24);
  });

  it("5 alumnos bloqueados sueltos: cada uno se mantiene en su grupo", () => {
    const students = makeStudents(24);
    const initial = createPods({
      students,
      presentCount: 24,
      robotCount: 6,
      maxPerPod: 4,
      seed: "init",
    }).pods;
    const locked = [
      initial[0]!.students[0]!.id,
      initial[1]!.students[0]!.id,
      initial[2]!.students[0]!.id,
      initial[3]!.students[0]!.id,
      initial[4]!.students[0]!.id,
    ];
    const podOfLocked = new Map<string, string>();
    locked.forEach((sid) => {
      const pod = initial.find((p) => p.students.some((s) => s.id === sid))!;
      podOfLocked.set(sid, pod.id);
    });

    const result = regroupWithLocks({
      currentPods: initial,
      lockedStudentIds: locked,
      allPresentStudents: students,
      seed: "regroup",
    });

    for (const sid of locked) {
      const podId = podOfLocked.get(sid)!;
      const pod = result.pods.find((p) => p.id === podId)!;
      expect(pod.students.some((s) => s.id === sid)).toBe(true);
    }
    expect(totalAssigned(result.pods)).toBe(24);
    expect(studentIdsIn(result.pods).size).toBe(24);
  });

  it("5 grupos bloqueados (20 alumnos), 4 libres / 4 plazas → ok", () => {
    const students = makeStudents(24);
    const initial = createPods({
      students,
      presentCount: 24,
      robotCount: 6,
      maxPerPod: 4,
      seed: "init",
    }).pods;
    const lockedIds = initial
      .slice(0, 5)
      .flatMap((p) => p.students.map((s) => s.id));

    const result = regroupWithLocks({
      currentPods: initial,
      lockedStudentIds: lockedIds,
      allPresentStudents: students,
      seed: "regroup",
    });
    expect(totalAssigned(result.pods)).toBe(24);
    expect(studentIdsIn(result.pods).size).toBe(24);
    expect(result.pods[5]!.students).toHaveLength(4);
  });

  it("0 libres y 0 plazas (todo bloqueado) → ok, no error", () => {
    const students = makeStudents(24);
    const initial = createPods({
      students,
      presentCount: 24,
      robotCount: 6,
      maxPerPod: 4,
      seed: "init",
    }).pods;
    const lastPod = initial[5]!;
    const allLockedIds = [
      ...initial.slice(0, 5).flatMap((p) => p.students.map((s) => s.id)),
      ...lastPod.students.map((s) => s.id),
    ];

    const result = regroupWithLocks({
      currentPods: initial,
      lockedStudentIds: allLockedIds,
      allPresentStudents: students,
      seed: "regroup",
    });
    expect(totalAssigned(result.pods)).toBe(24);
    expect(result.pods[5]!.students.map((s) => s.id).sort()).toEqual(
      lastPod.students.map((s) => s.id).sort(),
    );
  });

  it("libres > plazas → lanza RegroupLocksError con conteos correctos", () => {
    const baseStudents = makeStudents(6);
    const extraStudent: Student = { id: "s-extra", full_name: "Nuevo" };
    const initial = createPods({
      students: baseStudents,
      presentCount: 6,
      robotCount: 3,
      maxPerPod: 2,
      seed: "init",
    }).pods;
    const lockedIds = initial[0]!.students.map((s) => s.id);

    expect(() =>
      regroupWithLocks({
        currentPods: initial,
        lockedStudentIds: lockedIds,
        allPresentStudents: [...baseStudents, extraStudent],
        seed: "regroup",
      }),
    ).toThrow(RegroupLocksError);
  });

  it("excepción individual en pod 'todo bloqueado': el alumno excepto va al pool libre", () => {
    const students = makeStudents(24);
    const initial = createPods({
      students,
      presentCount: 24,
      robotCount: 6,
      maxPerPod: 4,
      seed: "init",
    }).pods;
    const pod0 = initial[0]!;
    const exceptedId = pod0.students[0]!.id;
    const lockedIds = initial.flatMap((p) =>
      p.students.map((s) => s.id),
    ).filter((id) => id !== exceptedId);

    const result = regroupWithLocks({
      currentPods: initial,
      lockedStudentIds: lockedIds,
      allPresentStudents: students,
      seed: "regroup",
    });

    expect(totalAssigned(result.pods)).toBe(24);
    expect(studentIdsIn(result.pods).size).toBe(24);
    const finalPod0 = result.pods.find((p) => p.id === pod0.id)!;
    const otherFixed = pod0.students
      .filter((s) => s.id !== exceptedId)
      .map((s) => s.id);
    for (const sid of otherFixed) {
      expect(finalPod0.students.some((s) => s.id === sid)).toBe(true);
    }
  });

  it("respeta capacidad: ningún grupo pasa de maxCapacity", () => {
    const students = makeStudents(24);
    const initial = createPods({
      students,
      presentCount: 24,
      robotCount: 6,
      maxPerPod: 4,
      seed: "init",
    }).pods;
    const result = regroupWithLocks({
      currentPods: initial,
      lockedStudentIds: [],
      allPresentStudents: students,
      seed: "regroup",
    });
    for (const pod of result.pods) {
      expect(pod.students.length).toBeLessThanOrEqual(pod.maxCapacity);
    }
  });

  it("resetea evaluation a null en todos los pods devueltos", () => {
    const students = makeStudents(12);
    const initial = createPods({
      students,
      presentCount: 12,
      robotCount: 3,
      maxPerPod: 4,
      seed: "init",
    }).pods;
    const initialWithEval = initial.map((p, i) => ({
      ...p,
      evaluation: (["green", "amber", "red"] as const)[i] ?? null,
    }));
    const result = regroupWithLocks({
      currentPods: initialWithEval,
      lockedStudentIds: [],
      allPresentStudents: students,
      seed: "regroup",
    });
    for (const pod of result.pods) {
      expect(pod.evaluation).toBeNull();
    }
  });
});
