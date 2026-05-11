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
  ring: string;
};

const OPTIONS: Option[] = [
  {
    value: "green",
    label: "Verde",
    emoji: "🟢",
    bg: "bg-emerald-100 hover:bg-emerald-200",
    ring: "ring-emerald-500",
  },
  {
    value: "amber",
    label: "Ámbar",
    emoji: "🟡",
    bg: "bg-amber-100 hover:bg-amber-200",
    ring: "ring-amber-500",
  },
  {
    value: "red",
    label: "Rojo",
    emoji: "🔴",
    bg: "bg-rose-100 hover:bg-rose-200",
    ring: "ring-rose-500",
  },
];

export function PodEvaluationRadio({ podId, current }: Props) {
  const setPodEvaluation = usePodsStore((s) => s.setPodEvaluation);

  const onClick = (value: Exclude<PodEvaluation, null>) => {
    setPodEvaluation(podId, current === value ? null : value);
  };

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
              "inline-flex items-center justify-center size-6 rounded-full text-xs leading-none transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1",
              opt.bg,
              selected ? `ring-2 ring-offset-1 ${opt.ring}` : "ring-1 ring-transparent",
            )}
          >
            <span aria-hidden>{opt.emoji}</span>
          </button>
        );
      })}
    </div>
  );
}
