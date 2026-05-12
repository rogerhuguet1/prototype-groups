import { describe, it, expect } from "vitest";
import {
  createEmptyPod,
  createPods,
  type Student,
} from "@/lib/pods/create-pods";
import { POD_COLORS } from "@/lib/pods/pod-colors";
import { GROUP_NAMES } from "@/lib/pods/group-names";

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

  it("10 / 4 → [3,3,2,2] balanceado", () => {
    const { pods } = createPods({
      students: makeStudents(10),
      presentCount: 10,
      robotCount: 4,
    });
    expect(pods).toHaveLength(4);
    expect(pods.map((p) => p.students.length)).toEqual([3, 3, 2, 2]);
  });

  it("12 / 4 → [3,3,3,3] balanceado", () => {
    const { pods } = createPods({
      students: makeStudents(12),
      presentCount: 12,
      robotCount: 4,
    });
    expect(pods.map((p) => p.students.length)).toEqual([3, 3, 3, 3]);
  });

  it("13 / 4 → [4,3,3,3] balanceado, sin pendientes", () => {
    const { pods } = createPods({
      students: makeStudents(13),
      presentCount: 13,
      robotCount: 4,
    });
    expect(pods.map((p) => p.students.length)).toEqual([4, 3, 3, 3]);
    expect(pods.flatMap((p) => p.students).length).toBe(13);
  });

  it("16 / 4 → [4,4,4,4] exacto, sin pendientes", () => {
    const { pods } = createPods({
      students: makeStudents(16),
      presentCount: 16,
      robotCount: 4,
    });
    expect(pods.map((p) => p.students.length)).toEqual([4, 4, 4, 4]);
    expect(pods.flatMap((p) => p.students).length).toBe(16);
  });

  it("18 / 4 → [4,4,4,4] + 2 pendientes (capacidad superada)", () => {
    const { pods } = createPods({
      students: makeStudents(18),
      presentCount: 18,
      robotCount: 4,
    });
    expect(pods.map((p) => p.students.length)).toEqual([4, 4, 4, 4]);
    expect(pods.flatMap((p) => p.students).length).toBe(16);
  });

  it("30 / 5 → [4,4,4,4,4] + 10 pendientes", () => {
    const { pods } = createPods({
      students: makeStudents(30),
      presentCount: 30,
      robotCount: 5,
    });
    expect(pods.map((p) => p.students.length)).toEqual([4, 4, 4, 4, 4]);
    expect(pods.flatMap((p) => p.students).length).toBe(20);
  });

  it("30 / 10 → diez grupos de 3, sin pendientes", () => {
    const { pods } = createPods({
      students: makeStudents(30),
      presentCount: 30,
      robotCount: 10,
    });
    expect(pods.map((p) => p.students.length)).toEqual([
      3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    ]);
    expect(pods.flatMap((p) => p.students).length).toBe(30);
  });

  it("20 / 5 → [4,4,4,4,4] exacto", () => {
    const { pods } = createPods({
      students: makeStudents(20),
      presentCount: 20,
      robotCount: 5,
    });
    expect(pods.map((p) => p.students.length)).toEqual([4, 4, 4, 4, 4]);
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
    expect(pods[0]?.name).toBe("ORION");
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
    expect(new Set(pods.map((p) => p.name)).size).toBe(15);
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

  it("nombres asignados son unicos dentro de la misma llamada (GROUP_NAMES por indice)", () => {
    const { pods } = createPods({
      students: makeStudents(12),
      presentCount: 12,
      robotCount: 6,
    });
    const names = pods.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual(GROUP_NAMES.slice(0, 6));
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

  it("si presentCount excede robotCount*4, los excedentes quedan como pendientes", () => {
    // 30/3 con default max=4: capacidad = 12. Los 18 restantes no se asignan.
    const { pods } = createPods({
      students: makeStudents(30),
      presentCount: 30,
      robotCount: 3,
    });
    expect(pods).toHaveLength(3);
    // Todos los pods al máximo, ningún pod > 4.
    expect(pods.map((p) => p.students.length)).toEqual([4, 4, 4]);
    expect(pods.flatMap((p) => p.students).length).toBe(12);
  });

  it("maxPerPod custom = 5: 30/4 cabe entero, reparto balanceado", () => {
    const { pods } = createPods({
      students: makeStudents(30),
      presentCount: 30,
      robotCount: 4,
      maxPerPod: 5,
    });
    expect(pods).toHaveLength(4);
    // 30/4 = 7 base + 2 extra → [8, 8, 7, 7]. Pero max=5 → cap a [5,5,5,5]
    // y 10 quedan pendientes.
    expect(pods.map((p) => p.students.length)).toEqual([5, 5, 5, 5]);
    expect(pods.flatMap((p) => p.students).length).toBe(20);
  });

  it("si presentCount < robotCount * 2 (pocos alumnos), reparto balanceado bajo el min", () => {
    // 3 alumnos / 2 robots: pod-1 con 2, pod-2 con 1. Bajar del min es válido.
    const { pods } = createPods({
      students: makeStudents(3),
      presentCount: 3,
      robotCount: 2,
    });
    expect(pods).toHaveLength(2);
    expect(pods.map((p) => p.students.length)).toEqual([2, 1]);
  });

  it("18 alumnos / 9 robots → 9 grupos de 2", () => {
    const { pods } = createPods({
      students: makeStudents(18),
      presentCount: 18,
      robotCount: 9,
    });
    expect(pods).toHaveLength(9);
    expect(pods.map((p) => p.students.length)).toEqual([2, 2, 2, 2, 2, 2, 2, 2, 2]);
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
      expect(podB.name).toBe(podA.name);
      expect(podB.color.hex).toBe(podA.color.hex);
      expect(podB.students.map((s) => s.id)).toEqual(
        podA.students.map((s) => s.id),
      );
    });
  });
});

describe("createEmptyPod", () => {
  it("crea un grupo vacio con el siguiente nombre disponible y color no usado", () => {
    const { pods: existing } = createPods({
      students: makeStudents(12),
      presentCount: 12,
      robotCount: 6,
    });
    const empty = createEmptyPod({ existing });
    expect(empty.students).toHaveLength(0);
    expect(empty.name).toBe(GROUP_NAMES[6]); // siguiente tras los 6 existentes
    expect(existing.map((p) => p.color.hex)).not.toContain(empty.color.hex);
  });

  it("error si existing tiene 15 grupos (limite de MAX_PODS)", () => {
    const existing: Parameters<typeof createEmptyPod>[0]["existing"] =
      Array.from({ length: 15 }, (_, i) => ({
        id: `pod-${i + 1}`,
        name: GROUP_NAMES[i] as string,
        color: POD_COLORS[i % POD_COLORS.length]!,
        students: [],
        maxCapacity: 4,
      }));
    expect(() => createEmptyPod({ existing })).toThrow(/Máximo 15 grupos/);
  });
});

describe("nombres de grupo (GROUP_NAMES)", () => {
  it("1 grupo → ORION", () => {
    const { pods } = createPods({
      students: makeStudents(2),
      presentCount: 2,
      robotCount: 1,
    });
    expect(pods.map((p) => p.name)).toEqual(["ORION"]);
  });

  it("2 grupos → ORION, APOLLO", () => {
    const { pods } = createPods({
      students: makeStudents(4),
      presentCount: 4,
      robotCount: 2,
    });
    expect(pods.map((p) => p.name)).toEqual(["ORION", "APOLLO"]);
  });

  it("4 grupos → ORION, APOLLO, VOYAGER, ARTEMIS", () => {
    const { pods } = createPods({
      students: makeStudents(12),
      presentCount: 12,
      robotCount: 4,
    });
    expect(pods.map((p) => p.name)).toEqual([
      "ORION",
      "APOLLO",
      "VOYAGER",
      "ARTEMIS",
    ]);
  });

  it("5 grupos → ORION, APOLLO, VOYAGER, ARTEMIS, ECLIPSE", () => {
    const { pods } = createPods({
      students: makeStudents(15),
      presentCount: 15,
      robotCount: 5,
    });
    expect(pods.map((p) => p.name)).toEqual([
      "ORION",
      "APOLLO",
      "VOYAGER",
      "ARTEMIS",
      "ECLIPSE",
    ]);
  });

  it("no se repiten nombres dentro de una misma agrupacion", () => {
    const { pods } = createPods({
      students: makeStudents(30),
      presentCount: 30,
      robotCount: 10,
    });
    const names = pods.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
