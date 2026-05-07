"use client";

import { useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { ChevronDown } from "lucide-react";
import { PodBadge } from "./PodBadge";
import { PodChangeDropdown } from "./PodChangeDropdown";
import { usePodsStore } from "@/store/pods-store";
import type { Pod } from "@/lib/pods/create-pods";

type Props = {
  student: { id: string; full_name: string };
  pod: Pod | null;
};

export function PodBadgeWithDropdown({ student, pod }: Props) {
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const {
    allPods,
    moveStudent,
    addStudentToPod,
    removeStudentFromPod,
    createPodAndAssignStudent,
  } = usePodsStore(
    useShallow((s) => ({
      allPods: s.pods,
      moveStudent: s.moveStudent,
      addStudentToPod: s.addStudentToPod,
      removeStudentFromPod: s.removeStudentFromPod,
      createPodAndAssignStudent: s.createPodAndAssignStudent,
    })),
  );

  function toggle() {
    if (triggerRect) {
      setTriggerRect(null);
      return;
    }
    const el = buttonRef.current;
    if (!el) return;
    setTriggerRect(el.getBoundingClientRect());
  }

  function handleSelect(podId: string | null) {
    if (podId === null) {
      if (pod) removeStudentFromPod(student.id);
    } else if (!pod) {
      addStudentToPod(student, podId);
    } else if (podId !== pod.id) {
      moveStudent(student.id, podId);
    }
    setTriggerRect(null);
  }

  function handleCreateAndAssign(emoji: string, label: string) {
    createPodAndAssignStudent(student, emoji, label);
    setTriggerRect(null);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={Boolean(triggerRect)}
        aria-label={
          pod
            ? `Cambiar grupo de este alumno (actualmente ${pod.emojiLabel})`
            : "Asignar a un grupo"
        }
        className="rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {pod ? (
          <PodBadge pod={pod} withChevron />
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border border-dashed border-slate-300 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-700 whitespace-nowrap leading-none">
            Sin grupo
            <ChevronDown className="size-3" aria-hidden />
          </span>
        )}
      </button>
      {triggerRect && (
        <PodChangeDropdown
          pods={allPods}
          currentPodId={pod?.id ?? null}
          triggerRect={triggerRect}
          onSelect={handleSelect}
          onCreateAndAssign={handleCreateAndAssign}
          onClose={() => setTriggerRect(null)}
        />
      )}
    </>
  );
}
