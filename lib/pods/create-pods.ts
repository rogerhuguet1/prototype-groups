import { colorForPodIndex, type PodColor } from "./pod-colors";

export type Student = {
  id: string;
  full_name: string;
};

export type Pod = {
  id: string;
  label: string;
  letter: string;
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
};

export const DEFAULT_MAX_PER_POD = 4;
export const DEFAULT_MIN_PER_POD = 3;

export function letterForPodIndex(index: number): string {
  if (index < 0) throw new Error("index negativo");
  let n = index;
  let s = "";
  while (true) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
    if (n < 0) break;
  }
  return s;
}

export function createPods(input: CreatePodsInput): Pod[] {
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
  if (presentCount > students.length) {
    throw new Error("No hay tantos alumnos en clase");
  }
  if (robotCount > presentCount) {
    throw new Error("Hay más robots que alumnos");
  }

  const present = students.slice(0, presentCount);
  const base = Math.floor(presentCount / robotCount);
  const extra = presentCount % robotCount;

  const pods: Pod[] = [];
  let cursor = 0;
  for (let i = 0; i < robotCount; i++) {
    const size = base + (i < extra ? 1 : 0);
    const slice = present.slice(cursor, cursor + size);
    cursor += size;
    const letter = letterForPodIndex(i);
    pods.push({
      id: `pod-${letter.toLowerCase()}`,
      label: `POD ${letter}`,
      letter,
      color: colorForPodIndex(i),
      students: slice,
      maxCapacity: maxPerPod,
    });
  }
  return pods;
}
