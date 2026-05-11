"use client";

import { Shuffle, List } from "lucide-react";
import { Button } from "../ui/Button";
import { usePodsStore } from "@/store/pods-store";
import { MAX_PODS } from "@/lib/pods/pod-emojis";
import type { Student } from "@/lib/pods/create-pods";

type Props = {
  students: Student[];
};

function defaultRobotCount(presentCount: number, last: number | null): number {
  if (last !== null && last >= 1 && last <= MAX_PODS) return last;
  return Math.min(MAX_PODS, Math.max(1, Math.ceil(presentCount / 4)));
}

export function PodMainButton({ students }: Props) {
  const sortMode = usePodsStore((s) => s.sortMode);
  const setSortMode = usePodsStore((s) => s.setSortMode);
  const createOrRegroup = usePodsStore((s) => s.createOrRegroup);
  const lastRobotCount = usePodsStore((s) => s.lastRobotCount);

  if (students.length === 0) return null;

  if (sortMode === "grouped") {
    return (
      <Button
        variant="secondary"
        onClick={() => setSortMode("alphabetical")}
        className="text-[11px] font-bold uppercase tracking-wider px-3 py-2"
        title="Volver a la lista alfabética"
      >
        <List className="size-3.5" aria-hidden />
        Volver a lista
      </Button>
    );
  }

  const onReagrupar = () => {
    // TODO Sub-fase E: abrir PodGroupingModal con selector de modo y campos.
    // Provisional: random + locks + count derivado.
    const presentStudents: Student[] = students.map((s) => ({
      id: s.id,
      full_name: s.full_name,
    }));
    const robotCount = defaultRobotCount(presentStudents.length, lastRobotCount);
    createOrRegroup({
      mode: "random",
      presentStudents,
      robotCount,
    });
  };

  return (
    <Button
      variant="secondary"
      onClick={onReagrupar}
      className="text-[11px] font-bold uppercase tracking-wider px-3 py-2"
      title="Generar/regenerar agrupación"
    >
      <Shuffle className="size-3.5" aria-hidden />
      Reagrupar
    </Button>
  );
}
