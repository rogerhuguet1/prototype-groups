import { describe, it, expect } from "vitest";
import {
  createEmptyPod,
  createPods,
  type Student,
} from "@/lib/pods/create-pods";
import { POD_COLORS } from "@/lib/pods/pod-colors";
import { POD_EMOJIS } from "@/lib/pods/pod-emojis";

function makeStudents(n: number): Student[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `s-${(i + 1).toString().padStart(3, "0")}`,
    full_name: `Alumno ${i + 1}`,
  }));
}

describe("createPods — casos del SUPERPROMPT §5", () => {
  it("24 alumnos / 6 robots → 6 grupos de 4", () => {
    const pods = createPods({
      students: makeStudents(30),
      presentCount: 24,
      robotCount: 6,
    });
    expect(pods).toHaveLength(6);
    expect(pods.map((p) => p.students.length)).toEqual([4, 4, 4, 4, 4, 4]);
    expect(pods.flatMap((p) => p.students.map((s) => s.id))).toHaveLength(24);
  });

  it("22 alumnos / 6 robots → 4 grupos de 4 + 2 grupos de 3", () => {
    const pods = createPods({
      students: makeStudents(30),
      presentCount: 22,
      robotCount: 6,
    });
    expect(pods).toHaveLength(6);
    expect(pods.map((p) => p.students.length)).toEqual([4, 4, 4, 4, 3, 3]);
  });

  it("18 alumnos / 5 robots → 3 grupos de 4 + 2 grupos de 3", () => {
    const pods = createPods({
      students: makeStudents(20),
      presentCount: 18,
      robotCount: 5,
    });
    expect(pods).toHaveLength(5);
    expect(pods.map((p) => p.students.length)).toEqual([4, 4, 4, 3, 3]);
  });

  it("20 alumnos / 5 robots → 5 grupos de 4", () => {
    const pods = createPods({
      students: makeStudents(20),
      presentCount: 20,
      robotCount: 5,
    });
    expect(pods).toHaveLength(5);
    expect(pods.map((p) => p.students.length)).toEqual([4, 4, 4, 4, 4]);
  });

  it("1 alumno / 1 robot → 1 grupo de 1", () => {
    const pods = createPods({
      students: makeStudents(1),
      presentCount: 1,
      robotCount: 1,
    });
    expect(pods).toHaveLength(1);
    expect(pods[0]?.students).toHaveLength(1);
    expect(pods[0]?.id).toBe("pod-1");
    expect(pods[0]?.emoji).toBeTruthy();
    expect(pods[0]?.emojiLabel).toBeTruthy();
  });

  it("0 alumnos / 1 robot → error", () => {
    expect(() =>
      createPods({
        students: [],
        presentCount: 0,
        robotCount: 1,
      }),
    ).toThrow(/más robots que alumnos/);
  });

  it("2 alumnos / 5 robots → error (más robots que alumnos)", () => {
    expect(() =>
      createPods({
        students: makeStudents(10),
        presentCount: 2,
        robotCount: 5,
      }),
    ).toThrow(/más robots que alumnos/);
  });

  it("30 alumnos / 16 robots → error (máximo 15 grupos)", () => {
    expect(() =>
      createPods({
        students: makeStudents(30),
        presentCount: 30,
        robotCount: 16,
      }),
    ).toThrow(/Máximo 15 grupos/);
  });

  it("30 alumnos / 15 robots → 15 grupos OK (en el límite)", () => {
    const pods = createPods({
      students: makeStudents(30),
      presentCount: 30,
      robotCount: 15,
    });
    expect(pods).toHaveLength(15);
    expect(new Set(pods.map((p) => p.emoji)).size).toBe(15);
  });
});

describe("createPods — comportamiento adicional", () => {
  it("toma los primeros presentCount alumnos como pool de presentes", () => {
    const students = makeStudents(10);
    const pods = createPods({ students, presentCount: 6, robotCount: 2 });
    const ids = pods.flatMap((p) => p.students.map((s) => s.id)).sort();
    expect(ids).toEqual([
      "s-001",
      "s-002",
      "s-003",
      "s-004",
      "s-005",
      "s-006",
    ]);
  });

  it("reparto entre grupos es aleatorio (no respeta orden de entrada)", () => {
    const students = makeStudents(24);
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const pods = createPods({ students, presentCount: 24, robotCount: 6 });
      const fingerprint = pods
        .map((p) => p.students.map((s) => s.id).join(","))
        .join("|");
      seen.add(fingerprint);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it("acepta un random() inyectable para reparto reproducible", () => {
    const students = makeStudents(8);
    const sequence = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7];
    let i = 0;
    const random = () => sequence[i++ % sequence.length] ?? 0;
    const a = createPods({ students, presentCount: 8, robotCount: 2, random });
    i = 0;
    const b = createPods({ students, presentCount: 8, robotCount: 2, random });
    expect(a.map((p) => p.students.map((s) => s.id))).toEqual(
      b.map((p) => p.students.map((s) => s.id)),
    );
  });

  it("emojis asignados son unicos dentro de la misma llamada", () => {
    const pods = createPods({
      students: makeStudents(12),
      presentCount: 12,
      robotCount: 6,
    });
    const emojis = pods.map((p) => p.emoji);
    expect(new Set(emojis).size).toBe(emojis.length);
    emojis.forEach((e) =>
      expect(POD_EMOJIS.map((x) => x.emoji)).toContain(e),
    );
  });

  it("colores asignados son unicos dentro de la misma llamada hasta 15", () => {
    const pods = createPods({
      students: makeStudents(15),
      presentCount: 15,
      robotCount: 15,
    });
    const colors = pods.map((p) => p.color.hex);
    expect(new Set(colors).size).toBe(15);
  });

  it("ids son pod-1, pod-2... incrementales", () => {
    const pods = createPods({
      students: makeStudents(12),
      presentCount: 12,
      robotCount: 4,
    });
    expect(pods.map((p) => p.id)).toEqual([
      "pod-1",
      "pod-2",
      "pod-3",
      "pod-4",
    ]);
  });

  it("error si presentCount > students.length", () => {
    expect(() =>
      createPods({
        students: makeStudents(5),
        presentCount: 10,
        robotCount: 2,
      }),
    ).toThrow(/No hay tantos alumnos/);
  });

  it("respeta maxPerPod cuando se pasa explicitamente", () => {
    const pods = createPods({
      students: makeStudents(12),
      presentCount: 12,
      robotCount: 3,
      maxPerPod: 5,
    });
    pods.forEach((p) => expect(p.maxCapacity).toBe(5));
  });
});

describe("createEmptyPod", () => {
  it("crea un grupo vacio con emoji y color no usados por los existentes", () => {
    const existing = createPods({
      students: makeStudents(12),
      presentCount: 12,
      robotCount: 6,
    });
    const empty = createEmptyPod({ existing });
    expect(empty.students).toHaveLength(0);
    expect(existing.map((p) => p.emoji)).not.toContain(empty.emoji);
    expect(existing.map((p) => p.color.hex)).not.toContain(empty.color.hex);
  });

  it("error si existing tiene 15 grupos (limite de emojis)", () => {
    const existing: Parameters<typeof createEmptyPod>[0]["existing"] =
      POD_EMOJIS.map((e, i) => ({
        id: `pod-${i + 1}`,
        emoji: e.emoji,
        emojiLabel: e.label,
        color: POD_COLORS[i % POD_COLORS.length]!,
        students: [],
        maxCapacity: 4,
      }));
    expect(() => createEmptyPod({ existing })).toThrow(/Máximo 15 grupos/);
  });
});
