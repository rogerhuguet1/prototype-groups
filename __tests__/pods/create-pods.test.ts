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
  it("24 alumnos / 6 robots → 6 grupos de 4 (con maxPerPod 4)", () => {
    const { pods } = createPods({
      students: makeStudents(30),
      presentCount: 24,
      robotCount: 6,
      maxPerPod: 4,
    });
    expect(pods).toHaveLength(6);
    expect(pods.map((p) => p.students.length)).toEqual([4, 4, 4, 4, 4, 4]);
    expect(pods.flatMap((p) => p.students.map((s) => s.id))).toHaveLength(24);
  });

  it("22 alumnos / 6 robots → 4 grupos de 4 + 2 de 3 (con maxPerPod 4)", () => {
    const { pods } = createPods({
      students: makeStudents(30),
      presentCount: 22,
      robotCount: 6,
      maxPerPod: 4,
    });
    expect(pods).toHaveLength(6);
    expect(pods.map((p) => p.students.length)).toEqual([4, 4, 4, 4, 3, 3]);
  });

  it("18 alumnos / 5 robots → 3 grupos de 4 + 2 de 3 (con maxPerPod 4)", () => {
    const { pods } = createPods({
      students: makeStudents(20),
      presentCount: 18,
      robotCount: 5,
      maxPerPod: 4,
    });
    expect(pods).toHaveLength(5);
    expect(pods.map((p) => p.students.length)).toEqual([4, 4, 4, 3, 3]);
  });

  it("20 alumnos / 5 robots → 5 grupos de 4 (con maxPerPod 4)", () => {
    const { pods } = createPods({
      students: makeStudents(20),
      presentCount: 20,
      robotCount: 5,
      maxPerPod: 4,
    });
    expect(pods).toHaveLength(5);
    expect(pods.map((p) => p.students.length)).toEqual([4, 4, 4, 4, 4]);
  });

  it("ratio 1:3 por defecto: 30 alumnos / 10 robots → 10 grupos de 3", () => {
    const { pods } = createPods({
      students: makeStudents(30),
      presentCount: 30,
      robotCount: 10,
    });
    expect(pods).toHaveLength(10);
    expect(pods.map((p) => p.students.length)).toEqual([
      3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    ]);
  });

  it("ratio 1:3 con resto: 28 alumnos / 10 robots → primeros llenos, los del final con menos", () => {
    const { pods } = createPods({
      students: makeStudents(30),
      presentCount: 28,
      robotCount: 10,
    });
    expect(pods.map((p) => p.students.length)).toEqual([
      3, 3, 3, 3, 3, 3, 3, 3, 2, 2,
    ]);
  });

  it("1 alumno / 1 robot → 1 grupo de 1", () => {
    const { pods } = createPods({
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
    const { pods } = createPods({
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
    const { pods } = createPods({ students, presentCount: 6, robotCount: 2 });
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
      const { pods } = createPods({
        students,
        presentCount: 24,
        robotCount: 6,
      });
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
    const a = createPods({
      students,
      presentCount: 8,
      robotCount: 2,
      random,
    });
    i = 0;
    const b = createPods({
      students,
      presentCount: 8,
      robotCount: 2,
      random,
    });
    expect(a.pods.map((p) => p.students.map((s) => s.id))).toEqual(
      b.pods.map((p) => p.students.map((s) => s.id)),
    );
  });

  it("emojis asignados son unicos dentro de la misma llamada", () => {
    const { pods } = createPods({
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
    const { pods } = createPods({
      students: makeStudents(15),
      presentCount: 15,
      robotCount: 15,
    });
    const colors = pods.map((p) => p.color.hex);
    expect(new Set(colors).size).toBe(15);
  });

  it("ids son pod-1, pod-2... incrementales", () => {
    const { pods } = createPods({
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

  it("si presentCount excede robotCount * maxPerPod (default 4), el resto queda sin asignar", () => {
    const { pods } = createPods({
      students: makeStudents(30),
      presentCount: 30,
      robotCount: 3,
    });
    expect(pods).toHaveLength(3);
    pods.forEach((p) => expect(p.students.length).toBeLessThanOrEqual(4));
    const totalAssigned = pods.reduce(
      (acc, p) => acc + p.students.length,
      0,
    );
    expect(totalAssigned).toBe(12);
  });

  it("excedentes con maxPerPod custom tambien se respeta el cap", () => {
    const { pods } = createPods({
      students: makeStudents(30),
      presentCount: 30,
      robotCount: 4,
      maxPerPod: 5,
    });
    pods.forEach((p) => expect(p.students.length).toBeLessThanOrEqual(5));
    const totalAssigned = pods.reduce(
      (acc, p) => acc + p.students.length,
      0,
    );
    expect(totalAssigned).toBe(20);
  });

  it("respeta maxPerPod cuando se pasa explicitamente", () => {
    const { pods } = createPods({
      students: makeStudents(12),
      presentCount: 12,
      robotCount: 3,
      maxPerPod: 5,
    });
    pods.forEach((p) => expect(p.maxCapacity).toBe(5));
  });
});

describe("createPods — reproducibilidad por seed", () => {
  it("sin seed devuelve una seed string no vacía", () => {
    const { seed } = createPods({
      students: makeStudents(12),
      presentCount: 12,
      robotCount: 4,
    });
    expect(typeof seed).toBe("string");
    expect(seed.length).toBeGreaterThan(0);
  });

  it("dos llamadas sin seed devuelven seeds distintas", () => {
    const a = createPods({
      students: makeStudents(12),
      presentCount: 12,
      robotCount: 4,
    });
    const b = createPods({
      students: makeStudents(12),
      presentCount: 12,
      robotCount: 4,
    });
    expect(a.seed).not.toBe(b.seed);
  });

  it("si se pasa una seed, esa misma seed se devuelve en el output", () => {
    const { seed } = createPods({
      students: makeStudents(12),
      presentCount: 12,
      robotCount: 4,
      seed: "una-seed-cualquiera",
    });
    expect(seed).toBe("una-seed-cualquiera");
  });

  it("misma seed + mismos inputs → output idéntico (5 ejecuciones)", () => {
    const students = makeStudents(24);
    const seed = "reproducible-test-seed";
    const results = Array.from({ length: 5 }, () =>
      createPods({ students, presentCount: 22, robotCount: 6, seed }),
    );
    const first = JSON.stringify(results[0]?.pods);
    results.forEach((r) => {
      expect(JSON.stringify(r.pods)).toBe(first);
    });
  });

  it("seeds distintas producen al menos un output distinto", () => {
    const students = makeStudents(24);
    const a = createPods({
      students,
      presentCount: 24,
      robotCount: 6,
      seed: "seed-a",
    });
    const b = createPods({
      students,
      presentCount: 24,
      robotCount: 6,
      seed: "seed-b-distinta",
    });
    expect(JSON.stringify(a.pods)).not.toBe(JSON.stringify(b.pods));
  });

  it("seed reproduce miembros, emojis y colores exactos", () => {
    const students = makeStudents(12);
    const seed = "control-de-color-y-emoji";
    const a = createPods({
      students,
      presentCount: 12,
      robotCount: 4,
      seed,
    });
    const b = createPods({
      students,
      presentCount: 12,
      robotCount: 4,
      seed,
    });
    a.pods.forEach((podA, i) => {
      const podB = b.pods[i]!;
      expect(podB.emoji).toBe(podA.emoji);
      expect(podB.color.hex).toBe(podA.color.hex);
      expect(podB.students.map((s) => s.id)).toEqual(
        podA.students.map((s) => s.id),
      );
    });
  });
});

describe("createEmptyPod", () => {
  it("crea un grupo vacio con emoji y color no usados por los existentes", () => {
    const { pods: existing } = createPods({
      students: makeStudents(12),
      presentCount: 12,
      robotCount: 6,
    });
    const empty = createEmptyPod({ existing });
    expect(empty.students).toHaveLength(0);
    expect(existing.map((p) => p.emoji)).not.toContain(empty.emoji);
    expect(existing.map((p) => p.color.hex)).not.toContain(empty.color.hex);
  });

  it("usa preferredEmoji si esta disponible", () => {
    const { pods: existing } = createPods({
      students: makeStudents(8),
      presentCount: 8,
      robotCount: 2,
    });
    const usedEmojis = existing.map((p) => p.emoji);
    const free = POD_EMOJIS.find((e) => !usedEmojis.includes(e.emoji))!;
    const empty = createEmptyPod({
      existing,
      preferredEmoji: { emoji: free.emoji, label: free.label },
    });
    expect(empty.emoji).toBe(free.emoji);
    expect(empty.emojiLabel).toBe(free.label);
  });

  it("ignora preferredEmoji si ya esta en uso y elige uno disponible", () => {
    const { pods: existing } = createPods({
      students: makeStudents(8),
      presentCount: 8,
      robotCount: 2,
    });
    const conflictingEmoji = existing[0]!.emoji;
    const empty = createEmptyPod({
      existing,
      preferredEmoji: { emoji: conflictingEmoji, label: "x" },
    });
    expect(existing.map((p) => p.emoji)).not.toContain(empty.emoji);
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
        isLocked: false,
      }));
    expect(() => createEmptyPod({ existing })).toThrow(/Máximo 15 grupos/);
  });
});
