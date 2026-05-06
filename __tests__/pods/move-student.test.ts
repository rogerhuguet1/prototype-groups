import { describe, it, expect } from "vitest";
import { createPods, type Student } from "@/lib/pods/create-pods";
import { addStudentToPod, moveStudent } from "@/lib/pods/move-student";

function makeStudents(n: number): Student[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `s-${(i + 1).toString().padStart(3, "0")}`,
    full_name: `Alumno ${i + 1}`,
  }));
}

describe("moveStudent", () => {
  it("mueve un alumno de POD A a POD B con espacio", () => {
    const pods = createPods({
      students: makeStudents(6),
      presentCount: 6,
      robotCount: 2,
    });
    const result = moveStudent(pods, "s-001", "pod-b");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const podA = result.pods.find((p) => p.id === "pod-a")!;
    const podB = result.pods.find((p) => p.id === "pod-b")!;
    expect(podA.students.map((s) => s.id)).not.toContain("s-001");
    expect(podB.students.map((s) => s.id)).toContain("s-001");
    expect(podA.students).toHaveLength(2);
    expect(podB.students).toHaveLength(4);
  });

  it("rechaza mover a un POD lleno", () => {
    const pods = createPods({
      students: makeStudents(8),
      presentCount: 8,
      robotCount: 2,
      maxPerPod: 4,
    });
    const result = moveStudent(pods, "s-001", "pod-b");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("destination-pod-full");
  });

  it("mover al mismo POD es no-op", () => {
    const pods = createPods({
      students: makeStudents(6),
      presentCount: 6,
      robotCount: 2,
    });
    const result = moveStudent(pods, "s-001", "pod-a");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.pods).toEqual(pods);
  });

  it("rechaza alumno inexistente", () => {
    const pods = createPods({
      students: makeStudents(6),
      presentCount: 6,
      robotCount: 2,
    });
    const result = moveStudent(pods, "no-existe", "pod-b");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("student-not-found");
  });

  it("rechaza POD destino inexistente", () => {
    const pods = createPods({
      students: makeStudents(6),
      presentCount: 6,
      robotCount: 2,
    });
    const result = moveStudent(pods, "s-001", "pod-zz");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("destination-pod-not-found");
  });

  it("no muta los pods originales (devuelve copia)", () => {
    const pods = createPods({
      students: makeStudents(6),
      presentCount: 6,
      robotCount: 2,
    });
    const snapshot = JSON.stringify(pods);
    const result = moveStudent(pods, "s-001", "pod-b");
    expect(result.ok).toBe(true);
    expect(JSON.stringify(pods)).toBe(snapshot);
  });
});

describe("addStudentToPod", () => {
  it("añade un alumno no asignado al POD destino", () => {
    const all = makeStudents(10);
    const pods = createPods({
      students: all,
      presentCount: 6,
      robotCount: 2,
    });
    const unassigned = all[7]!;
    const result = addStudentToPod(pods, unassigned, "pod-a");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const podA = result.pods.find((p) => p.id === "pod-a")!;
    expect(podA.students.map((s) => s.id)).toContain(unassigned.id);
  });

  it("rechaza si el POD destino está lleno", () => {
    const all = makeStudents(10);
    const pods = createPods({
      students: all,
      presentCount: 8,
      robotCount: 2,
      maxPerPod: 4,
    });
    const unassigned = all[8]!;
    const result = addStudentToPod(pods, unassigned, "pod-a");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("destination-pod-full");
  });

  it("si el alumno ya estaba en otro POD, lo mueve (delega en moveStudent)", () => {
    const pods = createPods({
      students: makeStudents(6),
      presentCount: 6,
      robotCount: 2,
    });
    const studentInA = pods[0]!.students[0]!;
    const result = addStudentToPod(pods, studentInA, "pod-b");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const podA = result.pods.find((p) => p.id === "pod-a")!;
    const podB = result.pods.find((p) => p.id === "pod-b")!;
    expect(podA.students.map((s) => s.id)).not.toContain(studentInA.id);
    expect(podB.students.map((s) => s.id)).toContain(studentInA.id);
  });
});
