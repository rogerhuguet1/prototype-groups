import {
  DEFAULT_MAX_PER_POD,
  computePodSizes,
  shuffleInPlace,
  type Pod,
  type Student,
} from "./create-pods";
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
    const kept = pod.students.filter(
      (s) => lockedSet.has(s.id) && presentSet.has(s.id),
    );
    return { ...pod, students: kept };
  });

  const free: Student[] = [];
  for (const pod of currentPods) {
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

  // Capacidad libre tras los locks. El max por pod es duro: si los free
  // sobrepasan la capacidad libre, los excedentes quedan fuera (= pendientes).
  const maxPerPod = newPods[0]?.maxCapacity ?? DEFAULT_MAX_PER_POD;
  const totalSlots = newPods.reduce(
    (acc, p) => acc + (maxPerPod - p.students.length),
    0,
  );

  shuffleInPlace(free, random);
  const freeAssignable = free.slice(0, totalSlots);

  // Tamaños objetivo balanceados sobre (locked + freeAssignable). Empareja
  // sizes (desc) con pods ordenados por locked desc para evitar que un pod
  // quede por debajo de sus locks. Cap a maxPerPod por pod.
  const lockedTotals = newPods.map((p) => p.students.length);
  const totalAssignable =
    lockedTotals.reduce((a, b) => a + b, 0) + freeAssignable.length;
  const sizes = computePodSizes({
    assignableCount: totalAssignable,
    robotCount: newPods.length,
  });
  const podOrder = [...newPods.keys()].sort(
    (a, b) => (lockedTotals[b] as number) - (lockedTotals[a] as number),
  );
  const targetSize = new Array<number>(newPods.length).fill(0);
  podOrder.forEach((podIdx, sortedI) => {
    targetSize[podIdx] = Math.min(maxPerPod, sizes[sortedI] as number);
  });

  let cursor = 0;
  for (let i = 0; i < newPods.length; i++) {
    const pod = newPods[i] as Pod;
    const need = Math.max(0, (targetSize[i] as number) - pod.students.length);
    const take = Math.min(need, freeAssignable.length - cursor);
    for (let j = 0; j < take; j++) {
      pod.students.push(freeAssignable[cursor++] as Student);
    }
  }
  // Si quedó alguno por colocar dentro del cap (raro), reparte por capacidad
  // libre restante sin pasar maxPerPod.
  while (cursor < freeAssignable.length) {
    let placed = false;
    for (const pod of newPods) {
      if (cursor >= freeAssignable.length) break;
      if (pod.students.length < maxPerPod) {
        pod.students.push(freeAssignable[cursor++] as Student);
        placed = true;
      }
    }
    if (!placed) break;
  }

  return { pods: newPods, seed };
}
