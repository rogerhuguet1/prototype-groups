"use client";

import { Users } from "lucide-react";
import { Button } from "../ui/Button";
import { usePodsStore } from "@/store/pods-store";
import { MAX_PODS } from "@/lib/pods/pod-emojis";
import type { Student } from "@/lib/pods/create-pods";

type Props = {
  students: Student[];
  classId: string | null;
};

function robotCountFor(presentCount: number): number {
  return Math.min(MAX_PODS, Math.max(1, Math.ceil(presentCount / 4)));
}

export function PodCreateGroupsButton({ students, classId }: Props) {
  const hasPods = usePodsStore((s) => s.pods.length > 0);
  const createPodsFromInput = usePodsStore((s) => s.createPodsFromInput);

  if (hasPods) return null;
  if (students.length === 0) return null;

  const onClick = () => {
    const robotCount = robotCountFor(students.length);
    createPodsFromInput({
      students: students.map((s) => ({
        id: s.id,
        full_name: s.full_name,
      })),
      presentCount: students.length,
      robotCount,
      classId,
    });
  };

  return (
    <Button
      variant="secondary"
      onClick={onClick}
      className="text-[11px] font-bold uppercase tracking-wider px-3 py-2"
      title="Generar la primera agrupación aleatoria"
    >
      <Users className="size-3.5" aria-hidden />
      Agrupar
    </Button>
  );
}
