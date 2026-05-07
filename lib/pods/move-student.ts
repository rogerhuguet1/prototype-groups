import type { Pod, Student } from "./create-pods";

export type MoveStudentResult =
  | { ok: true; pods: Pod[] }
  | { ok: false; reason: MoveError };

export type MoveError =
  | "student-not-found"
  | "destination-pod-not-found"
  | "destination-pod-full"
  | "source-pod-not-found"
  | "student-locked"
  | "source-pod-locked"
  | "destination-pod-locked";

export const MOVE_ERROR_MESSAGES: Record<MoveError, string> = {
  "student-not-found": "El alumno no está en ningún grupo",
  "destination-pod-not-found": "El grupo destino no existe",
  "destination-pod-full": "El grupo destino está lleno",
  "source-pod-not-found": "Grupo de origen no encontrado",
  "student-locked": "Este alumno está bloqueado",
  "source-pod-locked": "El grupo de origen está bloqueado",
  "destination-pod-locked": "El grupo destino está bloqueado",
};

export type MoveOptions = {
  lockedStudentIds?: string[];
};

function findPodByStudent(pods: Pod[], studentId: string): Pod | undefined {
  return pods.find((p) => p.students.some((s) => s.id === studentId));
}

export function moveStudent(
  pods: Pod[],
  studentId: string,
  toPodId: string,
  options: MoveOptions = {},
): MoveStudentResult {
  const lockedSet = new Set(options.lockedStudentIds ?? []);

  const fromPod = findPodByStudent(pods, studentId);
  if (!fromPod) return { ok: false, reason: "student-not-found" };

  const toPod = pods.find((p) => p.id === toPodId);
  if (!toPod) return { ok: false, reason: "destination-pod-not-found" };

  if (fromPod.id === toPod.id) return { ok: true, pods };

  if (lockedSet.has(studentId)) {
    return { ok: false, reason: "student-locked" };
  }
  if (fromPod.isLocked) {
    return { ok: false, reason: "source-pod-locked" };
  }
  if (toPod.isLocked) {
    return { ok: false, reason: "destination-pod-locked" };
  }
  if (toPod.students.length >= toPod.maxCapacity) {
    return { ok: false, reason: "destination-pod-full" };
  }

  const student = fromPod.students.find((s) => s.id === studentId);
  if (!student) return { ok: false, reason: "student-not-found" };

  const newPods = pods.map((p) => {
    if (p.id === fromPod.id) {
      return { ...p, students: p.students.filter((s) => s.id !== studentId) };
    }
    if (p.id === toPod.id) {
      return { ...p, students: [...p.students, student] };
    }
    return p;
  });
  return { ok: true, pods: newPods };
}

export function addStudentToPod(
  pods: Pod[],
  student: Student,
  toPodId: string,
  options: MoveOptions = {},
): MoveStudentResult {
  const alreadyIn = findPodByStudent(pods, student.id);
  if (alreadyIn) {
    return moveStudent(pods, student.id, toPodId, options);
  }

  const lockedSet = new Set(options.lockedStudentIds ?? []);

  const toPod = pods.find((p) => p.id === toPodId);
  if (!toPod) return { ok: false, reason: "destination-pod-not-found" };
  if (toPod.isLocked) {
    return { ok: false, reason: "destination-pod-locked" };
  }
  if (lockedSet.has(student.id)) {
    return { ok: false, reason: "student-locked" };
  }
  if (toPod.students.length >= toPod.maxCapacity) {
    return { ok: false, reason: "destination-pod-full" };
  }

  const newPods = pods.map((p) =>
    p.id === toPodId ? { ...p, students: [...p.students, student] } : p,
  );
  return { ok: true, pods: newPods };
}

export function removeStudentFromPod(
  pods: Pod[],
  studentId: string,
  options: MoveOptions = {},
): MoveStudentResult {
  const lockedSet = new Set(options.lockedStudentIds ?? []);

  const fromPod = findPodByStudent(pods, studentId);
  if (!fromPod) return { ok: false, reason: "student-not-found" };

  if (lockedSet.has(studentId)) {
    return { ok: false, reason: "student-locked" };
  }
  if (fromPod.isLocked) {
    return { ok: false, reason: "source-pod-locked" };
  }

  const newPods = pods.map((p) =>
    p.id === fromPod.id
      ? { ...p, students: p.students.filter((s) => s.id !== studentId) }
      : p,
  );
  return { ok: true, pods: newPods };
}
