"use client";

import { useEffect, useState } from "react";
import { Bot, Minus, Plus } from "lucide-react";
import { usePodsStore } from "@/store/pods-store";
import { groupingSchema } from "@/lib/pods/grouping-schema";
import { cn } from "@/lib/utils/cn";
import { MAX_PODS } from "@/lib/pods/pod-emojis";
import type { Student } from "@/lib/pods/create-pods";

type Props = {
  students: Student[];
};

export function PodCountControls({ students }: Props) {
  const podCount = usePodsStore((s) => s.pods.length);
  const createOrRegroup = usePodsStore((s) => s.createOrRegroup);

  // El input usa string para permitir vaciarlo durante la edición sin que se
  // fuerce automáticamente a 0 (UX común en inputs number).
  const [text, setText] = useState<string>(String(podCount || 1));
  const [error, setError] = useState<string | null>(null);

  // Sync con el store cuando cambia desde fuera (reagrupar, eliminar grupo).
  useEffect(() => {
    setText(String(podCount));
  }, [podCount]);

  const apply = (newRobot: number) => {
    if (newRobot === podCount) return;
    const parsed = groupingSchema.safeParse({
      mode: "random",
      presentCount: students.length,
      robotCount: newRobot,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Valor no válido");
      window.setTimeout(() => setError(null), 4000);
      setText(String(podCount));
      return;
    }
    try {
      const presentStudents = students.map((s) => ({
        id: s.id,
        full_name: s.full_name,
      }));
      createOrRegroup({
        mode: "random",
        presentStudents,
        robotCount: parsed.data.robotCount,
      });
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      window.setTimeout(() => setError(null), 4000);
      setText(String(podCount));
    }
  };

  const commit = () => {
    if (text.trim() === "") {
      setText(String(podCount));
      return;
    }
    const n = Number(text);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      setText(String(podCount));
      return;
    }
    apply(n);
  };

  const step = (delta: number) => {
    const next = Math.max(1, Math.min(MAX_PODS, podCount + delta));
    if (next === podCount) return;
    apply(next);
  };

  const buttonCls = cn(
    "inline-flex size-7 items-center justify-center rounded-full bg-white",
    "text-c360-blue border border-c360-blue/40",
    "hover:bg-c360-blue hover:text-white hover:border-c360-blue",
    "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-c360-blue",
    "focus:outline-none focus:ring-2 focus:ring-c360-blue focus:ring-offset-1",
    "transition-colors",
  );

  const canDecrease = podCount > 1;
  const canIncrease = podCount < MAX_PODS;

  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex items-center gap-2 rounded-full border border-c360-blue/30 bg-c360-blue/5 pl-3 pr-1 py-1">
        <Bot className="size-4 text-c360-blue" aria-hidden />
        <span className="text-[11px] font-bold uppercase tracking-wider text-c360-blue">
          Robots
        </span>
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={!canDecrease}
          aria-label="Quitar un robot"
          title="Quitar un robot"
          className={buttonCls}
        >
          <Minus className="size-3.5" aria-hidden />
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={text}
          onChange={(e) => setText(e.target.value.replace(/[^0-9]/g, ""))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          aria-label="Número de robots"
          className="w-8 text-center text-sm font-bold text-c360-text bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-c360-blue rounded"
        />
        <button
          type="button"
          onClick={() => step(1)}
          disabled={!canIncrease}
          aria-label="Añadir un robot"
          title="Añadir un robot"
          className={buttonCls}
        >
          <Plus className="size-3.5" aria-hidden />
        </button>
      </div>
      {error && (
        <span className="text-xs text-rose-700 max-w-xs" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
