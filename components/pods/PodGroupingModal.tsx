"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { usePodsStore } from "@/store/pods-store";
import {
  DEFAULT_MAX_PER_POD,
  DEFAULT_MIN_PER_POD,
  type Student,
} from "@/lib/pods/create-pods";
import { MAX_PODS } from "@/lib/pods/pod-emojis";
import { groupingSchema } from "@/lib/pods/grouping-schema";

function defaultRobotCount(presentCount: number, last: number | null): number {
  if (last !== null && last >= 1 && last <= MAX_PODS) return last;
  return Math.min(MAX_PODS, Math.max(1, Math.ceil(presentCount / 4)));
}

type Props = {
  open: boolean;
  onClose: () => void;
  students: Student[];
};

export function PodGroupingModal({ open, onClose, students }: Props) {
  const lastRobotCount = usePodsStore((s) => s.lastRobotCount);
  const createOrRegroup = usePodsStore((s) => s.createOrRegroup);

  const [presentCount, setPresentCount] = useState<number>(students.length);
  const [robotCount, setRobotCount] = useState<number>(
    defaultRobotCount(students.length, lastRobotCount),
  );
  const [error, setError] = useState<string | null>(null);

  // Reset only on the transition closed -> open. Avoid resetting when
  // lastRobotCount or students.length change while the modal is open (those
  // updates would otherwise overwrite values the user is editing).
  const wasOpenRef = useRef(open);
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setPresentCount(students.length);
      setRobotCount(defaultRobotCount(students.length, lastRobotCount));
      setError(null);
    }
    wasOpenRef.current = open;
  }, [open, students.length, lastRobotCount]);

  const onConfirm = () => {
    const parsed = groupingSchema.safeParse({
      mode: "random",
      presentCount,
      robotCount,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    const presentStudents = students.slice(0, parsed.data.presentCount);
    try {
      createOrRegroup({
        mode: "random",
        presentStudents,
        robotCount: parsed.data.robotCount,
      });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Agrupar"
      description={`Cada grupo tendrá entre ${DEFAULT_MIN_PER_POD} y ${DEFAULT_MAX_PER_POD} alumnos. Después podrás reagrupar con otros criterios.`}
    >
      <div className="space-y-4">
        <Input
          label="Alumnos presentes hoy"
          type="number"
          min={1}
          max={students.length}
          value={presentCount}
          onChange={(e) => {
            const n = Number(e.target.value);
            setPresentCount(Number.isFinite(n) ? n : 0);
          }}
          hint={`En la clase hay ${students.length} alumnos. Reduce este número si hay ausentes.`}
        />
        <Input
          label="Robots disponibles"
          type="number"
          min={1}
          max={MAX_PODS}
          value={robotCount}
          onChange={(e) => {
            const n = Number(e.target.value);
            setRobotCount(Number.isFinite(n) ? n : 0);
          }}
        />
        {error && (
          <div
            role="alert"
            className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
          >
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm}>
            Agrupar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
