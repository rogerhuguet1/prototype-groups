"use client";

import { useDroppable } from "@dnd-kit/core";
import type { CSSProperties } from "react";
import type { Pod } from "@/lib/pods/create-pods";

type Props = {
  pod: Pod;
  children: React.ReactNode;
};

export function PodDroppableTbody({ pod, children }: Props) {
  const { isOver, setNodeRef, active } = useDroppable({
    id: `pod:${pod.id}`,
    data: { type: "pod", podId: pod.id },
  });

  const fromPodId = active?.data.current?.["fromPodId"] as string | undefined;
  const sourceIsThisPod = fromPodId === pod.id;
  const showValid = isOver && !sourceIsThisPod;

  // El max recomendado es 4 pero no estricto: aceptamos siempre el drop.
  // No mostramos estado 'invalido' rojo. Solo highlight verde al hover.
  const style: CSSProperties | undefined = showValid
    ? {
        boxShadow: "inset 0 0 0 2px rgb(16 185 129)",
        backgroundColor: "rgba(16, 185, 129, 0.04)",
      }
    : undefined;

  return (
    <tbody ref={setNodeRef} style={style}>
      {children}
    </tbody>
  );
}
