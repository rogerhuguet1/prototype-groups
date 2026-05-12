import { POD_COLORS, type PodColor } from "./pod-colors";
import { MAX_PODS, POD_EMOJIS, type PodEmoji } from "./pod-emojis";
import { generateSeed, randomFromSeed } from "./seeded-random";

export type Student = {
  id: string;
  full_name: string;
};

export type PodEvaluation = "green" | "amber" | "red" | null;

export type Pod = {
  id: string;
  emoji: string;
  emojiLabel: string;
  color: PodColor;
  students: Student[];
  maxCapacity: number;
  evaluation: PodEvaluation;
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

export function distributionErrorMessage(
  presentCount: number,
  robotCount: number,
  minPerPod: number,
  maxPerPod: number,
): string {
  return `No se puede distribuir ${presentCount} alumnos en ${robotCount} grupos respetando min ${minPerPod} y max ${maxPerPod}.`;
}

export type CreatePodsOutput = {
  pods: Pod[];
  seed: string;
};

export const DEFAULT_MAX_PER_POD = 4;
export const DEFAULT_MIN_PER_POD = 2;

/**
 * Devuelve los tamaños objetivo para `robotCount` grupos que suman
 * `presentCount`.
 *
 * Si la combinación cabe en `[robotCount*minPerPod, robotCount*maxPerPod]`,
 * **maximiza grupos de `maxPerPod`** y deja la cola con valores en
 * `[minPerPod, maxPerPod-1]`. Ejemplos con min=2 max=4:
 *   22/6  → [4,4,4,4,4,2]
 *   18/9  → [2,2,2,2,2,2,2,2,2]
 *   30/10 → [4,4,4,4,4,2,2,2,2,2]
 *
 * Si NO cabe (faltan robots o sobran), **reparto balanceado** base+extra:
 *   30/3  → [10,10,10]  (excede max recomendado)
 *   3/2   → [2,1]       (debajo de min recomendado)
 */
export function computePodSizes({
  presentCount,
  robotCount,
  minPerPod,
  maxPerPod,
}: {
  presentCount: number;
  robotCount: number;
  minPerPod: number;
  maxPerPod: number;
}): number[] {
  if (robotCount <= 0) return [];

  const fitsInRange =
    presentCount >= robotCount * minPerPod &&
    presentCount <= robotCount * maxPerPod;

  if (!fitsInRange) {
    // Reparto balanceado simple. Primeros pods reciben uno más si hay resto.
    const base = Math.floor(presentCount / robotCount);
    const extra = presentCount % robotCount;
    return Array.from({ length: robotCount }, (_, i) =>
      i < extra ? base + 1 : base,
    );
  }

  // Cabe: maximizar grupos llenos.
  const sizes = new Array<number>(robotCount).fill(minPerPod);
  let stock = presentCount - robotCount * minPerPod;
  for (let i = 0; i < robotCount && stock > 0; i++) {
    const add = Math.min(stock, maxPerPod - minPerPod);
    sizes[i] = (sizes[i] as number) + add;
    stock -= add;
  }
  return sizes;
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
    minPerPod = DEFAULT_MIN_PER_POD,
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
  // min/maxPerPod son recomendados, no estrictos. computePodSizes adapta el
  // reparto si la combinación queda fuera del rango (más robots o menos).

  const seed = input.seed ?? generateSeed();
  const random = input.random ?? randomFromSeed(seed);

  const present = shuffleInPlace(students.slice(0, presentCount), random);
  const emojis = shuffleInPlace([...POD_EMOJIS], random).slice(0, robotCount);
  const colors = pickUniqueColors(robotCount, [], random);

  const sizes = computePodSizes({
    presentCount,
    robotCount,
    minPerPod,
    maxPerPod,
  });

  const pods: Pod[] = [];
  let cursor = 0;
  for (let i = 0; i < robotCount; i++) {
    const size = sizes[i] as number;
    const slice = present.slice(cursor, cursor + size);
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
      evaluation: null,
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
    evaluation: null,
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
  minPerPod?: number;
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
  minPerPod?: number;
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
    ...(input.minPerPod !== undefined ? { minPerPod: input.minPerPod } : {}),
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
    minPerPod = DEFAULT_MIN_PER_POD,
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
  // min/maxPerPod son recomendados, no estrictos.

  const seed = input.seed ?? generateSeed();
  const random = randomFromSeed(seed);

  const lockedSet = new Set(lockedStudentIds);
  const pool = students.slice(0, presentCount);
  const presentSet = new Set(pool.map((s) => s.id));
  const presentMap = new Map(pool.map((s) => [s.id, s]));

  // Locked students that survive: must be present AND have a current pod whose
  // id falls in pod-1..pod-{robotCount}. Anything else returns to the free pool.
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
      lockedByPodIndex[idx]!.push(presentMap.get(s.id) as Student);
      lockedKept.add(s.id);
    }
  }

  const freeStudents = pool.filter((s) => !lockedKept.has(s.id));
  const lockedTotal = Array.from(lockedKept).length;
  // validacion presentCount in [min*robot, max*robot] ya asegura que cabe sin cap.
  const effectiveFree = freeStudents.length;

  const sortedFree = [...freeStudents].sort(
    (a, b) => scoreFn(b.id) - scoreFn(a.id),
  );

  const emojis = shuffleInPlace([...POD_EMOJIS], random).slice(0, robotCount);
  const colors = pickUniqueColors(robotCount, [], random);

  const buckets: Student[][] = Array.from(
    { length: robotCount },
    () => [],
  );

  // En modos por nivel/progreso usamos reparto BALANCEADO (no maximize-4),
  // porque la semantica de 'agrupar juntos por nivel' exige tamanos parecidos.
  // computePodSizes (que maximiza 4s) solo se usa en createPods/regroupWithLocks.
  const totalPresent = effectiveFree + lockedTotal;
  const baseSize = Math.floor(totalPresent / robotCount);
  const extraSize = totalPresent % robotCount;
  const targetSizes = Array.from({ length: robotCount }, (_, i) =>
    i < extraSize ? baseSize + 1 : baseSize,
  );
  // Free quota por pod = target - locked. Si los locks exceden el target, el
  // pod no recibe free students; los free van a otros pods con espacio.
  const freeQuota = targetSizes.map((t, i) =>
    Math.max(0, t - lockedByPodIndex[i]!.length),
  );
  let overflow =
    effectiveFree - freeQuota.reduce((acc, n) => acc + n, 0);
  for (let i = 0; i < robotCount && overflow > 0; i++) {
    freeQuota[i] = (freeQuota[i] as number) + 1;
    overflow -= 1;
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

  // Prepend locked students (preserved from their original pod) to each bucket
  // so they keep priority in the resulting order.
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
    evaluation: null,
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
