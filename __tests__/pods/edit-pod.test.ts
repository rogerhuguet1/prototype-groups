import { describe, it, expect } from "vitest";
import { createPods, type Student } from "@/lib/pods/create-pods";
import { changePodEmoji } from "@/lib/pods/edit-pod";

function makeStudents(n: number): Student[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `s-${(i + 1).toString().padStart(3, "0")}`,
    full_name: `Alumno ${i + 1}`,
  }));
}

const noShuffle = () => 0.999;

describe("changePodEmoji", () => {
  it("cambia el emoji y label del grupo destino", () => {
    const { pods } = createPods({
      students: makeStudents(8),
      presentCount: 8,
      robotCount: 2,
      random: noShuffle,
    });
    const result = changePodEmoji(pods, "pod-1", "🦄", "Unicornio");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const pod1 = result.pods.find((p) => p.id === "pod-1")!;
    expect(pod1.emoji).toBe("🦄");
    expect(pod1.emojiLabel).toBe("Unicornio");
  });

  it("error si el emoji ya esta en uso por otro grupo", () => {
    const { pods } = createPods({
      students: makeStudents(8),
      presentCount: 8,
      robotCount: 2,
      random: noShuffle,
    });
    const otherEmoji = pods[1]!.emoji;
    const result = changePodEmoji(pods, "pod-1", otherEmoji, "x");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("emoji-in-use");
  });

  it("cambiar al mismo emoji es no-op", () => {
    const { pods } = createPods({
      students: makeStudents(8),
      presentCount: 8,
      robotCount: 2,
      random: noShuffle,
    });
    const original = pods[0]!.emoji;
    const result = changePodEmoji(pods, "pod-1", original, pods[0]!.emojiLabel);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.pods).toEqual(pods);
  });

  it("error si el grupo no existe", () => {
    const { pods } = createPods({
      students: makeStudents(8),
      presentCount: 8,
      robotCount: 2,
      random: noShuffle,
    });
    const result = changePodEmoji(pods, "pod-99", "🦄", "x");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("pod-not-found");
  });

  it("no muta los pods originales", () => {
    const { pods } = createPods({
      students: makeStudents(8),
      presentCount: 8,
      robotCount: 2,
      random: noShuffle,
    });
    const snapshot = JSON.stringify(pods);
    changePodEmoji(pods, "pod-1", "🦄", "x");
    expect(JSON.stringify(pods)).toBe(snapshot);
  });
});
