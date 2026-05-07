"use client";

import { Users } from "lucide-react";
import { Button } from "../ui/Button";
import { usePodsStore } from "@/store/pods-store";
import { useHistoryStore } from "@/store/history-store";
import { MAX_PODS } from "@/lib/pods/pod-emojis";
import type { Student } from "@/lib/pods/create-pods";

type Props = {
  students: Student[];
  classId: string | null;
};

function robotCountFor(presentCount: number): number {
  return Math.min(MAX_PODS, Math.max(1, Math.ceil(presentCount / 3)));
}

export function PodToggleViewButton({ students, classId }: Props) {
  const viewWithPods = usePodsStore((s) => s.viewWithPods);
  const createPodsFromInput = usePodsStore((s) => s.createPodsFromInput);
  const setCurrentEntryId = usePodsStore((s) => s.setCurrentEntryId);
  const addEntry = useHistoryStore((s) => s.addEntry);

  if (viewWithPods) return null;
  if (students.length === 0) return null;

  const onClick = () => {
    const robotCount = robotCountFor(students.length);
    const result = createPodsFromInput({
      students: students.map((s) => ({
        id: s.id,
        full_name: s.full_name,
      })),
      presentCount: students.length,
      robotCount,
      classId,
    });
    const entryId = crypto.randomUUID();
    addEntry({
      id: entryId,
      timestamp: new Date().toISOString(),
      classId,
      presentStudents: students.length,
      robotCount,
      seed: result.seed,
      pods: result.pods,
      isFavorite: false,
    });
    setCurrentEntryId(entryId);
  };

  return (
    <Button
      variant="secondary"
      onClick={onClick}
      className="text-[11px] font-bold uppercase tracking-wider px-3 py-2"
      title="Generar grupos aleatorios"
    >
      <Users className="size-3.5" aria-hidden />
      Grupos
    </Button>
  );
}
