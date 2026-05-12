import {
  computePodSizes,
  DEFAULT_MAX_PER_POD,
  DEFAULT_MIN_PER_POD,
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
    return { ...pod, students: kept, evaluation: null };
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

  const totalSlots = newPods.reduce(
    (acc, p) => acc + (p.maxCapacity - p.students.length),
    0,
  );

  if (free.length > totalSlots) {
    throw new RegroupLocksError(free.length, totalSlots);
  }

  shuffleInPlace(free, random);

  // Maximizar grupos llenos: calcular tamaños objetivo (4,4,...,4,3,2,...) y
  // asignarlos a los pods empezando por los que tienen más lockeados, para
  // garantizar que ningún pod recibe un target menor que sus locks.
  const maxPerPod = newPods[0]?.maxCapacity ?? DEFAULT_MAX_PER_POD;
  const presentCount = newPods.reduce(
    (acc, p) => acc + p.students.length,
    0,
  ) + free.length;
  const robotCount = newPods.length;
  const sizes = computePodSizes({
    presentCount,
    robotCount,
    minPerPod: DEFAULT_MIN_PER_POD,
    maxPerPod,
  });

  // Empareja pods (ordenados por locked.length desc) con sizes (desc).
  const podOrder = [...newPods.keys()].sort(
    (a, b) =>
      (newPods[b] as Pod).students.length - (newPods[a] as Pod).students.length,
  );
  const target = new Array<number>(robotCount).fill(0);
  podOrder.forEach((podIdx, sortedI) => {
    target[podIdx] = sizes[sortedI] as number;
  });

  // Llenar cada pod hasta su target con alumnos free (in-order, ya están
  // mezclados).
  let cursor = 0;
  for (let i = 0; i < newPods.length; i++) {
    const pod = newPods[i] as Pod;
    const need = Math.max(0, (target[i] as number) - pod.students.length);
    const take = Math.min(need, free.length - cursor);
    for (let j = 0; j < take; j++) {
      pod.students.push(free[cursor++] as Student);
    }
  }

  // Si quedó algún alumno por colocar (target ajustado < free disponible por
  // locks excesivos), rellenar por capacidad hasta maxPerPod.
  while (cursor < free.length) {
    let placed = false;
    for (const pod of newPods) {
      if (cursor >= free.length) break;
      if (pod.students.length < pod.maxCapacity) {
        pod.students.push(free[cursor++] as Student);
        placed = true;
      }
    }
    if (!placed) break;
  }

  return { pods: newPods, seed };
}
