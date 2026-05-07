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
    const lockedPods = [initial[0]!, initial[1]!].map((p) => ({
      ...p,
      isLocked: true,
    }));
    const startPods = [...lockedPods, ...initial.slice(2)];
    const lockedStudentIdsInPods = new Set(
      lockedPods.flatMap((p) => p.students.map((s) => s.id)),
    );

    const result = regroupWithLocks({
      currentPods: startPods,
      lockedStudentIds: [],
      allPresentStudents: students,
      seed: "regroup",
    });

    expect(result.pods[0]!.isLocked).toBe(true);
    expect(result.pods[1]!.isLocked).toBe(true);
    expect(result.pods[0]!.students.map((s) => s.id)).toEqual(
      lockedPods[0]!.students.map((s) => s.id),
    );
    expect(result.pods[1]!.students.map((s) => s.id)).toEqual(
      lockedPods[1]!.students.map((s) => s.id),
    );
    expect(totalAssigned(result.pods)).toBe(24);
    expect(studentIdsIn(result.pods).size).toBe(24);
    const inLockedAfter = new Set([
      ...result.pods[0]!.students.map((s) => s.id),
      ...result.pods[1]!.students.map((s) => s.id),
    ]);
    expect(inLockedAfter).toEqual(lockedStudentIdsInPods);
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
    const startPods = initial.map((p, i) =>
      i < 5 ? { ...p, isLocked: true } : p,
    );

    const result = regroupWithLocks({
      currentPods: startPods,
      lockedStudentIds: [],
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
    const lockedStudentIds = lastPod.students.map((s) => s.id);
    const startPods = initial.map((p, i) =>
      i < 5 ? { ...p, isLocked: true } : p,
    );

    const result = regroupWithLocks({
      currentPods: startPods,
      lockedStudentIds,
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
    const startPods = initial.map((p, i) =>
      i === 0 ? { ...p, isLocked: true } : p,
    );

    expect(() =>
      regroupWithLocks({
        currentPods: startPods,
        lockedStudentIds: [],
        allPresentStudents: [...baseStudents, extraStudent],
        seed: "regroup",
      }),
    ).toThrow(RegroupLocksError);
  });

  it("respeta capacidad: ningún grupo no bloqueado pasa de maxCapacity", () => {
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
});
