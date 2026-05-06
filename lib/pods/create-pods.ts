import { POD_COLORS, type PodColor } from "./pod-colors";
import { MAX_PODS, POD_EMOJIS, type PodEmoji } from "./pod-emojis";

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
  random?: () => number;
};

export const DEFAULT_MAX_PER_POD = 4;
export const DEFAULT_MIN_PER_POD = 3;

export function shuffleInPlace<T>(arr: T[], random: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = arr[i] as T;
    arr[i] = arr[j] as T;
    arr[j] = tmp;
  }
  return arr;
}

export function createPods(input: CreatePodsInput): Pod[] {
  const {
    students,
    presentCount,
    robotCount,
    maxPerPod = DEFAULT_MAX_PER_POD,
    random = Math.random,
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

  const capacity = robotCount * maxPerPod;
  const effectivePresent = Math.min(presentCount, capacity);

  const present = shuffleInPlace(
    students.slice(0, presentCount),
    random,
  ).slice(0, effectivePresent);
  const emojis = shuffleInPlace([...POD_EMOJIS], random).slice(0, robotCount);
  const colors = pickUniqueColors(robotCount, [], random);

  const base = Math.floor(effectivePresent / robotCount);
  const extra = effectivePresent % robotCount;

  const pods: Pod[] = [];
  let cursor = 0;
  for (let i = 0; i < robotCount; i++) {
    const size = base + (i < extra ? 1 : 0);
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
    });
  }
  return pods;
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

function pickUniqueColors(
  count: number,
  excluded: PodColor[],
  random: () => number,
): PodColor[] {
  const excludedHex = new Set(excluded.map((c) => c.hex));
  const available = POD_COLORS.filter((c) => !excludedHex.has(c.hex));
  const pool = shuffleInPlace([...available], random);
  if (pool.length >= count) return pool.slice(0, count);

  const overflow = shuffleInPlace([...POD_COLORS], random);
  const result = [...pool];
  let i = 0;
  while (result.length < count) {
    result.push(overflow[i % overflow.length] as PodColor);
    i++;
  }
  return result;
}
