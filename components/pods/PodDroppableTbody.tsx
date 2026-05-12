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
  const isFull = pod.students.length >= pod.maxCapacity;
  const showInvalid = isOver && isFull && !sourceIsThisPod;
  const showValid = isOver && !isFull && !sourceIsThisPod;

  let style: CSSProperties | undefined;
  if (showInvalid) {
    style = {
      boxShadow: "inset 0 0 0 2px rgb(244 63 94)",
      backgroundColor: "rgba(244, 63, 94, 0.04)",
      cursor: "not-allowed",
    };
  } else if (showValid) {
    style = {
      boxShadow: "inset 0 0 0 2px rgb(16 185 129)",
      backgroundColor: "rgba(16, 185, 129, 0.04)",
    };
  }

  return (
    <tbody ref={setNodeRef} style={style}>
      {children}
    </tbody>
  );
}
