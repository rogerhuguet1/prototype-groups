"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { usePodsStore } from "@/store/pods-store";

export function SessionPrompt() {
  const hydrated = usePodsStore((s) => s.hydrated);
  const podCount = usePodsStore((s) => s.pods.length);
  const lastRobotCount = usePodsStore((s) => s.lastRobotCount);
  const lastPresentCount = usePodsStore((s) => s.lastPresentCount);
  const resetPods = usePodsStore((s) => s.resetPods);

  const [asked, setAsked] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hydrated || asked) return;
    if (podCount > 0) setOpen(true);
    setAsked(true);
  }, [hydrated, asked, podCount]);

  const onContinue = () => setOpen(false);
  const onReset = () => {
    resetPods();
    setOpen(false);
  };

  const descParts: string[] = [];
  if (lastPresentCount !== null) {
    descParts.push(`${lastPresentCount} alumnos`);
  }
  if (lastRobotCount !== null) {
    descParts.push(`${lastRobotCount} robots`);
  }
  const lastConfig =
    descParts.length > 0 ? ` La última sesión fue con ${descParts.join(" y ")}.` : "";

  return (
    <Modal
      open={open}
      onClose={onContinue}
      title="¿Continuar con la sesión anterior?"
      description={`Encontramos ${podCount} grupo${podCount === 1 ? "" : "s"} de la última vez.${lastConfig}`}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Puedes seguir trabajando sobre los mismos grupos, o empezar de cero
          si la sesión de hoy es distinta.
        </p>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <Button variant="ghost" size="sm" onClick={onReset}>
            Empezar nueva sesión
          </Button>
          <Button variant="primary" size="sm" onClick={onContinue}>
            Continuar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
