"use client";

import { useState } from "react";
import { Users, RotateCcw } from "lucide-react";
import { Button } from "../ui/Button";
import { PodGroupingModal } from "./PodGroupingModal";
import { usePodsStore } from "@/store/pods-store";
import { useHistoryStore } from "@/store/history-store";
import type { Student } from "@/lib/pods/create-pods";

type Props = {
  students: Student[];
  classId: string | null;
};

export function PodGroupingButton({ students, classId }: Props) {
  const [open, setOpen] = useState(false);
  const createPodsFromInput = usePodsStore((s) => s.createPodsFromInput);
  const resetPods = usePodsStore((s) => s.resetPods);
  const hasPods = usePodsStore((s) => s.pods.length > 0);
  const addEntry = useHistoryStore((s) => s.addEntry);

  return (
    <>
      <div className="flex items-center gap-2">
        {hasPods && (
          <Button
            variant="ghost"
            onClick={resetPods}
            title="Borrar los PODs creados"
            size="md"
            className="text-slate-600"
          >
            <RotateCcw className="size-4" aria-hidden />
            Reiniciar
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={() => setOpen(true)}
          disabled={students.length === 0}
          className="text-[11px] font-bold uppercase tracking-wider px-3 py-2"
        >
          <Users className="size-3.5" aria-hidden />
          Agrupar
        </Button>
      </div>
      <PodGroupingModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={(input) => {
          const result = createPodsFromInput({
            students,
            presentCount: input.presentCount,
            robotCount: input.robotCount,
            classId,
          });
          addEntry({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            classId,
            presentStudents: input.presentCount,
            robotCount: input.robotCount,
            seed: result.seed,
            pods: result.pods,
            isFavorite: false,
          });
          setOpen(false);
        }}
        totalStudents={students.length}
      />
    </>
  );
}
