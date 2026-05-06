"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import {
  fieldErrorsFromZod,
  podGroupingSchema,
  type PodGroupingErrors,
  type PodGroupingInput,
} from "@/lib/pods/grouping-schema";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (input: PodGroupingInput) => void;
  totalStudents: number;
};

export function PodGroupingModal({
  open,
  onClose,
  onConfirm,
  totalStudents,
}: Props) {
  const [presentCount, setPresentCount] = useState("");
  const [robotCount, setRobotCount] = useState("");
  const [errors, setErrors] = useState<PodGroupingErrors>({});

  useEffect(() => {
    if (!open) return;
    setPresentCount(totalStudents > 0 ? String(totalStudents) : "");
    setRobotCount("");
    setErrors({});
  }, [open, totalStudents]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const present = parseInt(presentCount, 10);
    const robots = parseInt(robotCount, 10);

    if (Number.isNaN(present) || Number.isNaN(robots)) {
      setErrors({
        presentCount: Number.isNaN(present)
          ? "Indica cuántos alumnos hay presentes"
          : undefined,
        robotCount: Number.isNaN(robots)
          ? "Indica cuántos robots hay disponibles"
          : undefined,
      });
      return;
    }

    if (present > totalStudents) {
      setErrors({
        presentCount: `Solo hay ${totalStudents} alumnos en la clase`,
      });
      return;
    }

    const parsed = podGroupingSchema.safeParse({
      presentCount: present,
      robotCount: robots,
    });
    if (!parsed.success) {
      setErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    onConfirm(parsed.data);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Agrupar por PODs"
      description={`Hay ${totalStudents} alumnos en la clase. Cada POD será de 3 a 4 alumnos.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Alumnos presentes hoy"
          type="number"
          inputMode="numeric"
          min={1}
          max={totalStudents || undefined}
          step={1}
          value={presentCount}
          onChange={(e) => setPresentCount(e.target.value)}
          error={errors.presentCount}
          autoFocus
        />
        <Input
          label="Robots disponibles"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={robotCount}
          onChange={(e) => setRobotCount(e.target.value)}
          error={errors.robotCount}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Crear PODs
          </Button>
        </div>
      </form>
    </Modal>
  );
}
