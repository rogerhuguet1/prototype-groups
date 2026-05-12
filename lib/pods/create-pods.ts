import { POD_COLORS, type PodColor } from "./pod-colors";
import { MAX_PODS, POD_EMOJIS, type PodEmoji } from "./pod-emojis";
import { generateSeed, randomFromSeed } from "./seeded-random";

export type Student = {
  id: string;
  full_name: string;
};

export type Pod = {
  id: string;
  emoji: string;
  emojiLabel: string;
  color: PodColor;
  students: Student[];
  maxCapacity: number;
};

export type CreatePodsInput = {
  students: Student[];
  presentCount: number;
  robotCount: number;
  maxPerPod?: number;
  minPerPod?: number;
  seed?: string;
  random?: () => number;
};

export type CreatePodsOutput = {
  pods: Pod[];
  seed: string;
};

export const DEFAULT_MAX_PER_POD = 4;
export const DEFAULT_MIN_PER_POD = 2;

/**
 * Reparto **balanceado** simple para `robotCount` grupos sobre `assignableCount`
 * alumnos. Cada grupo recibe `base` o `base+1` (los primeros `extra` pods).
 *
 * Asume que `assignableCount ≤ robotCount * maxPerPod` (el caller debe haber
 * recortado el pool si excede capacidad — los alumnos sobrantes quedan como
 * "Pendientes de asignar").
 *
 * Ejemplos (con maxPerPod=4):
 *   10/4 → [3,3,2,2]
 *   12/4 → [3,3,3,3]
 *   13/4 → [4,3,3,3]
 *   16/4 → [4,4,4,4]
 *   30/10 → [3,3,3,3,3,3,3,3,3,3]
 *
 * Si el caller pasa 18 alumnos y 4 robots, debe llamar con assignableCount=16
 * (= min(18, 16)). El reparto será `[4,4,4,4]` y los 2 restantes quedan fuera.
 */
export function computePodSizes({
  assignableCount,
  robotCount,
}: {
  assignableCount: number;
  robotCount: number;
}): number[] {
  if (robotCount <= 0) return [];
  const base = Math.floor(assignableCount / robotCount);
  const extra = assignableCount % robotCount;
  return Array.from({ length: robotCount }, (_, i) =>
    i < extra ? base + 1 : base,
  );
}

export function shuffleInPlace<T>(arr: T[], random: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = arr[i] as T;
    arr[i] = arr[j] as T;
    arr[j] = tmp;
  }
  return arr;
}

export function createPods(input: CreatePodsInput): CreatePodsOutput {
  const {
    students,
    presentCount,
    robotCount,
    maxPerPod = DEFAULT_MAX_PER_POD,
  } = input;

  if (!Number.isInteger(presentCount) || presentCount < 0) {
    throw new Error("presentCount debe ser un entero >= 0");
  }
  if (!Number.isInteger(robotCount) || robotCount < 1) {
    throw new Error("robotCount debe ser un entero > 0");
  }
  if (robotCount > MAX_PODS) {
    throw new Error("Máximo 15 grupos permitidos");
  }
  if (presentCount > students.length) {
    throw new Error("No hay tantos alumnos en clase");
  }
  if (robotCount > presentCount) {
    throw new Error("Hay más robots que alumnos");
  }

  const seed = input.seed ?? generateSeed();
  const random = input.random ?? randomFromSeed(seed);

  const capacity = robotCount * maxPerPod;
  const assignableCount = Math.min(presentCount, capacity);

  // Mezclamos los presentes y solo asignamos los primeros `assignableCount`.
  // Los demás quedan fuera de cualquier pod = aparecerán como "Pendientes".
  const shuffled = shuffleInPlace(students.slice(0, presentCount), random);
  const assignable = shuffled.slice(0, assignableCount);

  const emojis = shuffleInPlace([...POD_EMOJIS], random).slice(0, robotCount);
  const colors = pickUniqueColors(robotCount, [], random);

  const sizes = computePodSizes({ assignableCount, robotCount });

  const pods: Pod[] = [];
  let cursor = 0;
  for (let i = 0; i < robotCount; i++) {
    const size = sizes[i] as number;
    const slice = assignable.slice(cursor, cursor + size);
    cursor += size;
    const emoji = emojis[i] as PodEmoji;
    const color = colors[i] as PodColor;
    pods.push({
      id: `pod-${i + 1}`,
      emoji: emoji.emoji,
      emojiLabel: emoji.label,
      color,
      students: slice,
      maxCapacity: maxPerPod,
    });
  }
  return { pods, seed };
}

export function createEmptyPod(input: {
  existing: Pod[];
  maxCapacity?: number;
  random?: () => number;
  preferredEmoji?: { emoji: string; label: string };
}): Pod {
  const {
    existing,
    maxCapacity = DEFAULT_MAX_PER_POD,
    random = Math.random,
    preferredEmoji,
  } = input;

  if (existing.length >= MAX_PODS) {
    throw new Error("Máximo 15 grupos permitidos");
  }

  const emojiInUse = new Set(existing.map((p) => p.emoji));

  let chosenEmoji: PodEmoji;
  if (preferredEmoji && !emojiInUse.has(preferredEmoji.emoji)) {
    chosenEmoji = {
      emoji: preferredEmoji.emoji,
      label: preferredEmoji.label,
    };
  } else {
    const availableEmojis = POD_EMOJIS.filter(
      (e) => !emojiInUse.has(e.emoji),
    );
    if (availableEmojis.length === 0) {
      throw new Error("No quedan emojis disponibles");
    }
    chosenEmoji = availableEmojis[
      Math.floor(random() * availableEmojis.length)
    ] as PodEmoji;
  }

  const colorsInUse = existing.map((p) => p.color);
  const [color] = pickUniqueColors(1, colorsInUse, random);

  return {
    id: `pod-${existing.length + 1}`,
    emoji: chosenEmoji.emoji,
    emojiLabel: chosenEmoji.label,
    color: color as PodColor,
    students: [],
    maxCapacity,
  };
}

export function pickUniqueColors(
  count: number,
  excluded: PodColor[],
  random: () => number,
): PodColor[] {
  if (count <= 0) return [];

  const excludedHex = new Set(excluded.map((c) => c.hex));
  const remaining = POD_COLORS.filter((c) => !excludedHex.has(c.hex));
  const alreadyPicked: PodColor[] = [...excluded];
  const result: PodColor[] = [];

  while (result.length < count && remaining.length > 0) {
    let nextIdx: number;
    if (alreadyPicked.length === 0) {
      nextIdx = Math.floor(random() * remaining.length);
    } else {
      let bestIdx = 0;
      let bestDist = -1;
      for (let i = 0; i < remaining.length; i++) {
        const c = remaining[i] as PodColor;
        let minDist = Infinity;
        for (const p of alreadyPicked) {
          const d = colorDistance(c, p);
          if (d < minDist) minDist = d;
        }
        if (minDist > bestDist) {
          bestDist = minDist;
          bestIdx = i;
        }
      }
      nextIdx = bestIdx;
    }
    const next = remaining[nextIdx] as PodColor;
    result.push(next);
    alreadyPicked.push(next);
    remaining.splice(nextIdx, 1);
  }

  while (result.length < count) {
    result.push(POD_COLORS[result.length % POD_COLORS.length] as PodColor);
  }
  return result;
}

export type RegroupMode = "mixed" | "leveled";

export type CreatePodsByLevelInput = {
  students: Student[];
  presentCount: number;
  robotCount: number;
  mode: RegroupMode;
  scoreFn: (studentId: string) => number;
  maxPerPod?: number;
  seed?: string;
  lockedStudentIds?: string[];
  currentPods?: Pod[];
};

export type CreatePodsByProgressInput = {
  students: Student[];
  presentCount: number;
  robotCount: number;
  progressFn: (studentId: string) => number;
  scoreFn: (studentId: string) => number;
  maxPerPod?: number;
  seed?: string;
  lockedStudentIds?: string[];
  currentPods?: Pod[];
};

export function createPodsByProgress(
  input: CreatePodsByProgressInput,
): CreatePodsOutput {
  const compositeScore = (id: string) =>
    input.progressFn(id) * 1000 + input.scoreFn(id);
  return createPodsByLevel({
    students: input.students,
    presentCount: input.presentCount,
    robotCount: input.robotCount,
    mode: "leveled",
    scoreFn: compositeScore,
    ...(input.maxPerPod !== undefined ? { maxPerPod: input.maxPerPod } : {}),
    ...(input.seed !== undefined ? { seed: input.seed } : {}),
    ...(input.lockedStudentIds !== undefined
      ? { lockedStudentIds: input.lockedStudentIds }
      : {}),
    ...(input.currentPods !== undefined
      ? { currentPods: input.currentPods }
      : {}),
  });
}

export function createPodsByLevel(
  input: CreatePodsByLevelInput,
): CreatePodsOutput {
  const {
    students,
    presentCount,
    robotCount,
    mode,
    scoreFn,
    maxPerPod = DEFAULT_MAX_PER_POD,
    lockedStudentIds = [],
    currentPods = [],
  } = input;

  if (!Number.isInteger(presentCount) || presentCount < 0) {
    throw new Error("presentCount debe ser un entero >= 0");
  }
  if (!Number.isInteger(robotCount) || robotCount < 1) {
    throw new Error("robotCount debe ser un entero > 0");
  }
  if (robotCount > MAX_PODS) {
    throw new Error("Máximo 15 grupos permitidos");
  }
  if (presentCount > students.length) {
    throw new Error("No hay tantos alumnos en clase");
  }
  if (robotCount > presentCount) {
    throw new Error("Hay más robots que alumnos");
  }

  const seed = input.seed ?? generateSeed();
  const random = randomFromSeed(seed);

  const capacity = robotCount * maxPerPod;
  const lockedSet = new Set(lockedStudentIds);
  const pool = students.slice(0, presentCount);
  const presentSet = new Set(pool.map((s) => s.id));
  const presentMap = new Map(pool.map((s) => [s.id, s]));

  // Alumnos lockeados que sobreviven: presentes Y con pod actual en
  // pod-1..pod-{robotCount}.
  const lockedByPodIndex: Student[][] = Array.from(
    { length: robotCount },
    () => [],
  );
  const lockedKept = new Set<string>();
  for (const pod of currentPods) {
    const idx = parseInt(pod.id.slice(4), 10) - 1;
    if (!Number.isInteger(idx) || idx < 0 || idx >= robotCount) continue;
    for (const s of pod.students) {
      if (!lockedSet.has(s.id)) continue;
      if (!presentSet.has(s.id)) continue;
      // Respeta el max duro: si un pod ya tiene maxPerPod lockeados, los demás
      // se quedan fuera.
      if (lockedByPodIndex[idx]!.length >= maxPerPod) continue;
      lockedByPodIndex[idx]!.push(presentMap.get(s.id) as Student);
      lockedKept.add(s.id);
    }
  }
  const lockedTotal = lockedKept.size;

  const freeStudents = pool.filter((s) => !lockedKept.has(s.id));

  // Capacidad libre tras locks; los alumnos que no caben quedan fuera.
  const freeCapacity = Math.max(0, capacity - lockedTotal);
  const sortedFree = [...freeStudents]
    .sort((a, b) => scoreFn(b.id) - scoreFn(a.id))
    .slice(0, freeCapacity);

  const emojis = shuffleInPlace([...POD_EMOJIS], random).slice(0, robotCount);
  const colors = pickUniqueColors(robotCount, [], random);

  const buckets: Student[][] = Array.from(
    { length: robotCount },
    () => [],
  );

  // Reparto BALANCEADO sobre (lockedTotal + sortedFree.length), descontando
  // lockedByPodIndex[i].length de cada pod. El max duro por pod es maxPerPod.
  const totalAssignable = lockedTotal + sortedFree.length;
  const baseSize = Math.floor(totalAssignable / robotCount);
  const extraSize = totalAssignable % robotCount;
  const targetSizes = Array.from({ length: robotCount }, (_, i) =>
    Math.min(maxPerPod, i < extraSize ? baseSize + 1 : baseSize),
  );
  // Free quota por pod = target - locked; cap a (maxPerPod - locked).
  const freeQuota = targetSizes.map((t, i) => {
    const lockedAtPod = lockedByPodIndex[i]!.length;
    const slotsAvailable = Math.max(0, maxPerPod - lockedAtPod);
    return Math.max(0, Math.min(slotsAvailable, t - lockedAtPod));
  });
  // Redistribuir overflow a pods con espacio (que no hayan llegado a maxPerPod).
  let overflow = sortedFree.length - freeQuota.reduce((acc, n) => acc + n, 0);
  for (let i = 0; i < robotCount && overflow > 0; i++) {
    const lockedAtPod = lockedByPodIndex[i]!.length;
    const slotsAvailable = maxPerPod - lockedAtPod;
    if ((freeQuota[i] as number) < slotsAvailable) {
      freeQuota[i] = (freeQuota[i] as number) + 1;
      overflow -= 1;
    }
  }

  if (mode === "leveled") {
    let cursor = 0;
    for (let i = 0; i < robotCount; i++) {
      const take = freeQuota[i] as number;
      buckets[i] = sortedFree.slice(cursor, cursor + take);
      cursor += take;
    }
  } else {
    // mixed: zigzag respetando freeQuota por pod.
    const remaining = [...freeQuota];
    let pos = 0;
    let dir: 1 | -1 = 1;
    for (let i = 0; i < sortedFree.length; i++) {
      let safety = 0;
      while ((remaining[pos] as number) <= 0 && safety++ < robotCount * 2) {
        if (dir === 1) {
          if (pos === robotCount - 1) {
            dir = -1;
            pos -= 1;
          } else pos += 1;
        } else {
          if (pos === 0) {
            dir = 1;
            pos += 1;
          } else pos -= 1;
        }
      }
      if ((remaining[pos] as number) <= 0) break;
      (buckets[pos] as Student[]).push(sortedFree[i] as Student);
      remaining[pos] = (remaining[pos] as number) - 1;
      if (dir === 1) {
        if (pos === robotCount - 1) dir = -1;
        else pos += 1;
      } else {
        if (pos === 0) dir = 1;
        else pos -= 1;
      }
    }
  }

  const finalBuckets = buckets.map((bucket, i) => [
    ...lockedByPodIndex[i]!,
    ...bucket,
  ]);

  const pods: Pod[] = finalBuckets.map((bucket, i) => ({
    id: `pod-${i + 1}`,
    emoji: (emojis[i] as PodEmoji).emoji,
    emojiLabel: (emojis[i] as PodEmoji).label,
    color: colors[i] as PodColor,
    students: bucket,
    maxCapacity: maxPerPod,
  }));

  return { pods, seed };
}

function colorDistance(a: PodColor, b: PodColor): number {
  const ar = parseInt(a.hex.slice(1, 3), 16);
  const ag = parseInt(a.hex.slice(3, 5), 16);
  const ab = parseInt(a.hex.slice(5, 7), 16);
  const br = parseInt(b.hex.slice(1, 3), 16);
  const bg = parseInt(b.hex.slice(3, 5), 16);
  const bb = parseInt(b.hex.slice(5, 7), 16);
  return Math.sqrt(
    (ar - br) * (ar - br) +
      (ag - bg) * (ag - bg) +
      (ab - bb) * (ab - bb),
  );
}
