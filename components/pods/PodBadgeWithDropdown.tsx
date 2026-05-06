"use client";

import { useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { PodBadge } from "./PodBadge";
import { PodChangeDropdown } from "./PodChangeDropdown";
import { usePodsStore } from "@/store/pods-store";
import type { Pod } from "@/lib/pods/create-pods";

type Props = {
  studentId: string;
  pod: Pod;
};

type Position = { top: number; left: number };

export function PodBadgeWithDropdown({ studentId, pod }: Props) {
  const [position, setPosition] = useState<Position | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { allPods, moveStudent, removeStudentFromPod } = usePodsStore(
    useShallow((s) => ({
      allPods: s.pods,
      moveStudent: s.moveStudent,
      removeStudentFromPod: s.removeStudentFromPod,
    })),
  );

  function toggle() {
    if (position) {
      setPosition(null);
      return;
    }
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition({ top: rect.bottom + 4, left: rect.left });
  }

  function handleSelect(podId: string | null) {
    if (podId === null) {
      removeStudentFromPod(studentId);
    } else if (podId !== pod.id) {
      moveStudent(studentId, podId);
    }
    setPosition(null);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={Boolean(position)}
        aria-label={`Cambiar grupo de este alumno (actualmente ${pod.emojiLabel})`}
        className="rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <PodBadge pod={pod} withChevron />
      </button>
      {position && (
        <PodChangeDropdown
          pods={allPods}
          currentPodId={pod.id}
          position={position}
          onSelect={handleSelect}
          onClose={() => setPosition(null)}
        />
      )}
    </>
  );
}
