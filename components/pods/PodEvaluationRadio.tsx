"use client";

import { cn } from "@/lib/utils/cn";
import { usePodsStore } from "@/store/pods-store";
import type { PodEvaluation } from "@/lib/pods/create-pods";

type Props = {
  podId: string;
  current: PodEvaluation;
};

type Option = {
  value: Exclude<PodEvaluation, null>;
  label: string;
  emoji: string;
  bg: string;
};

// Orden de izquierda a derecha: rojo, ambar, verde (verde a la derecha = "ok").
const OPTIONS: Option[] = [
  { value: "red", label: "Rojo", emoji: "🔴", bg: "bg-rose-100" },
  { value: "amber", label: "Ámbar", emoji: "🟡", bg: "bg-amber-100" },
  { value: "green", label: "Verde", emoji: "🟢", bg: "bg-emerald-100" },
];

export function PodEvaluationRadio({ podId, current }: Props) {
  const setPodEvaluation = usePodsStore((s) => s.setPodEvaluation);

  const onClick = (value: Exclude<PodEvaluation, null>) => {
    setPodEvaluation(podId, current === value ? null : value);
  };

  const anySelected = current !== null;

  return (
    <div
      role="radiogroup"
      aria-label="Evaluación del grupo"
      className="inline-flex items-center gap-1"
    >
      {OPTIONS.map((opt) => {
        const selected = current === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={opt.label}
            title={opt.label}
            onClick={() => onClick(opt.value)}
            className={cn(
              "inline-flex items-center justify-center size-6 rounded-full text-sm leading-none transition-all focus:outline-none focus:ring-2 focus:ring-c360-blue/40",
              selected
                ? `${opt.bg} opacity-100 scale-110`
                : anySelected
                  ? "opacity-20 hover:opacity-60"
                  : "opacity-40 hover:opacity-90",
            )}
          >
            <span aria-hidden>{opt.emoji}</span>
          </button>
        );
      })}
    </div>
  );
}
