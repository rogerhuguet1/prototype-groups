import { shuffleInPlace, type Pod, type Student } from "./create-pods";
import { generateSeed, randomFromSeed } from "./seeded-random";

export type RegroupWithLocksInput = {
  currentPods: Pod[];
  lockedStudentIds: string[];
  allPresentStudents: Student[];
  seed?: string;
  random?: () => number;
};

export type RegroupWithLocksOutput = {
  pods: Pod[];
  seed: string;
};

export class RegroupLocksError extends Error {
  freeCount: number;
  slotCount: number;
  constructor(freeCount: number, slotCount: number) {
    super(
      `No se puede reagrupar: hay ${freeCount} alumnos libres pero solo ${slotCount} plazas disponibles. Desbloquea algún grupo o alumno.`,
    );
    this.freeCount = freeCount;
    this.slotCount = slotCount;
    this.name = "RegroupLocksError";
  }
}

export function regroupWithLocks(
  input: RegroupWithLocksInput,
): RegroupWithLocksOutput {
  const { currentPods, lockedStudentIds, allPresentStudents } = input;

  const seed = input.seed ?? generateSeed();
  const random = input.random ?? randomFromSeed(seed);

  const lockedSet = new Set(lockedStudentIds);
  const presentSet = new Set(allPresentStudents.map((s) => s.id));
  const presentMap = new Map(allPresentStudents.map((s) => [s.id, s]));

  const studentToPod = new Map<string, Pod>();
  for (const pod of currentPods) {
    for (const s of pod.students) {
      studentToPod.set(s.id, pod);
    }
  }

  const newPods: Pod[] = currentPods.map((pod) => {
    if (pod.isLocked) {
      return { ...pod, students: [...pod.students] };
    }
    const kept = pod.students.filter(
      (s) => lockedSet.has(s.id) && presentSet.has(s.id),
    );
    return { ...pod, students: kept };
  });

  const free: Student[] = [];
  for (const pod of currentPods) {
    if (pod.isLocked) continue;
    for (const s of pod.students) {
      if (lockedSet.has(s.id)) continue;
      if (!presentSet.has(s.id)) continue;
      free.push(presentMap.get(s.id) as Student);
    }
  }
  for (const s of allPresentStudents) {
    if (!studentToPod.has(s.id) && !lockedSet.has(s.id)) {
      free.push(s);
    }
  }

  const targetPods = newPods.filter((p) => !p.isLocked);
  const totalSlots = targetPods.reduce(
    (acc, p) => acc + (p.maxCapacity - p.students.length),
    0,
  );

  if (free.length > totalSlots) {
    throw new RegroupLocksError(free.length, totalSlots);
  }

  shuffleInPlace(free, random);

  let i = 0;
  let safety = 0;
  while (i < free.length && safety++ < 10_000) {
    let placedThisRound = false;
    for (const pod of targetPods) {
      if (i >= free.length) break;
      if (pod.students.length < pod.maxCapacity) {
        pod.students.push(free[i] as Student);
        i++;
        placedThisRound = true;
      }
    }
    if (!placedThisRound) break;
  }

  return { pods: newPods, seed };
}
