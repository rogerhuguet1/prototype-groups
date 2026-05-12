"use client";

import { useEffect, useState } from "react";
import { usePodsStore } from "@/store/pods-store";
import { groupingSchema } from "@/lib/pods/grouping-schema";
import { cn } from "@/lib/utils/cn";
import type { Student } from "@/lib/pods/create-pods";

type Props = {
  students: Student[];
};

export function PodCountControls({ students }: Props) {
  const podCount = usePodsStore((s) => s.pods.length);
  const lastPresentCount = usePodsStore((s) => s.lastPresentCount);
  const createOrRegroup = usePodsStore((s) => s.createOrRegroup);

  const initialPresent = lastPresentCount ?? students.length;
  const [presentVal, setPresentVal] = useState<number>(initialPresent);
  const [robotVal, setRobotVal] = useState<number>(podCount);
  const [error, setError] = useState<string | null>(null);

  // Sync con el store cuando cambia desde fuera (eliminar grupo, reagrupar, etc).
  useEffect(() => {
    setPresentVal(lastPresentCount ?? students.length);
  }, [lastPresentCount, students.length]);
  useEffect(() => {
    setRobotVal(podCount);
  }, [podCount]);

  const apply = (newPresent: number, newRobot: number) => {
    const currentPresent = lastPresentCount ?? students.length;
    if (newPresent === currentPresent && newRobot === podCount) return;
    if (!Number.isFinite(newPresent) || !Number.isFinite(newRobot)) return;

    const parsed = groupingSchema.safeParse({
      mode: "random",
      presentCount: newPresent,
      robotCount: newRobot,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Valores no válidos");
      window.setTimeout(() => setError(null), 4000);
      // restablecer valores previos
      setPresentVal(currentPresent);
      setRobotVal(podCount);
      return;
    }
    try {
      const presentStudents = students.slice(0, parsed.data.presentCount);
      createOrRegroup({
        mode: "random",
        presentStudents,
        robotCount: parsed.data.robotCount,
      });
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      window.setTimeout(() => setError(null), 4000);
      setPresentVal(currentPresent);
      setRobotVal(podCount);
    }
  };

  const inputCls = cn(
    "w-12 px-1.5 py-1 border border-slate-300 rounded text-sm font-semibold text-c360-text",
    "focus:outline-none focus:ring-2 focus:ring-c360-blue focus:border-c360-blue",
  );
  const labelCls =
    "inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-c360-text-muted";

  return (
    <div className="flex items-center gap-3">
      <label className={labelCls}>
        Alumnos
        <input
          type="number"
          min={1}
          max={students.length}
          value={presentVal}
          onChange={(e) => setPresentVal(Number(e.target.value))}
          onBlur={() => apply(presentVal, robotVal)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className={inputCls}
        />
      </label>
      <label className={labelCls}>
        Robots
        <input
          type="number"
          min={1}
          value={robotVal}
          onChange={(e) => setRobotVal(Number(e.target.value))}
          onBlur={() => apply(presentVal, robotVal)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className={inputCls}
        />
      </label>
      {error && (
        <span className="text-xs text-rose-700 max-w-xs" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
