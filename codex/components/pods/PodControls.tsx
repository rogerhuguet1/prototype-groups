"use client";

import { usePodsStore } from "@/store/pods-store";
import { PodSortControl } from "./PodSortControl";

export function PodControls() {
  const hasPods = usePodsStore((s) => s.pods.length > 0);
  const regroupSelecting = usePodsStore((s) => s.regroupSelecting);
  const podCount = usePodsStore((s) => s.pods.length);
  const totalAssigned = usePodsStore((s) =>
    s.pods.reduce((acc, p) => acc + p.students.length, 0),
  );

  if (!hasPods || regroupSelecting) return null;

  return (
    <div className="bg-blue-50 border-b border-blue-100">
      <div className="flex items-center justify-between gap-4 px-8 py-2.5">
        <PodSortControl />
        <p className="text-xs text-slate-600">
          {podCount} grupo{podCount === 1 ? "" : "s"} · {totalAssigned} alumnos
          asignados
        </p>
      </div>
    </div>
  );
}
