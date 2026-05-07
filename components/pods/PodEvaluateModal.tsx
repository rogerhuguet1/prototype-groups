"use client";

import { useMemo, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import type {
  HistoryEntry,
  PodEvaluation,
  PodEvaluationRating,
} from "@/types/history";

const RATING_OPTIONS: {
  value: PodEvaluationRating;
  label: string;
  emoji: string;
  selectedClass: string;
  unselectedClass: string;
}[] = [
  {
    value: "red",
    label: "Mal",
    emoji: "😟",
    selectedClass: "bg-rose-500 text-white ring-rose-300 ring-2",
    unselectedClass: "bg-rose-50 text-rose-700 hover:bg-rose-100",
  },
  {
    value: "amber",
    label: "Regular",
    emoji: "😐",
    selectedClass: "bg-amber-400 text-amber-900 ring-amber-200 ring-2",
    unselectedClass: "bg-amber-50 text-amber-800 hover:bg-amber-100",
  },
  {
    value: "green",
    label: "Bien",
    emoji: "😀",
    selectedClass: "bg-emerald-500 text-white ring-emerald-300 ring-2",
    unselectedClass: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  },
];

type Props = {
  open: boolean;
  entry: HistoryEntry;
  onSave: (evaluations: PodEvaluation[]) => void;
  onClose: () => void;
};

export function PodEvaluateModal({ open, entry, onSave, onClose }: Props) {
  const initial = useMemo(() => {
    const map: Record<string, PodEvaluationRating | undefined> = {};
    entry.evaluations.forEach((e) => {
      map[e.podId] = e.rating;
    });
    return map;
  }, [entry.evaluations]);

  const [draft, setDraft] = useState<
    Record<string, PodEvaluationRating | undefined>
  >(initial);

  const setRating = (podId: string, rating: PodEvaluationRating) => {
    setDraft((prev) => ({
      ...prev,
      [podId]: prev[podId] === rating ? undefined : rating,
    }));
  };

  const hasAny = Object.values(draft).some((r) => r !== undefined);

  const handleSave = () => {
    const evaluations: PodEvaluation[] = entry.pods
      .map((p) => {
        const rating = draft[p.id];
        return rating ? { podId: p.id, rating } : null;
      })
      .filter((e): e is PodEvaluation => e !== null);
    onSave(evaluations);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="¿Cómo ha ido la sesión?"
      description="Marca un color por grupo. Saltar deja la sesión sin evaluar."
    >
      <div className="space-y-2">
        {entry.pods.map((pod) => {
          const selected = draft[pod.id];
          return (
            <div
              key={pod.id}
              className="flex items-center gap-3 py-1.5 border-b border-slate-100 last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-lg leading-none" aria-hidden>
                  {pod.emoji}
                </span>
                <span className="text-sm font-semibold text-slate-800 truncate">
                  Grupo {pod.emoji}
                </span>
              </div>
              <div
                role="radiogroup"
                aria-label={`Evaluación del grupo ${pod.emojiLabel}`}
                className="flex items-center gap-1.5 shrink-0"
              >
                {RATING_OPTIONS.map((opt) => {
                  const isSelected = selected === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={opt.label}
                      title={opt.label}
                      onClick={() => setRating(pod.id, opt.value)}
                      className={`inline-flex items-center justify-center size-9 rounded-md text-base transition ${
                        isSelected ? opt.selectedClass : opt.unselectedClass
                      }`}
                    >
                      <span aria-hidden>{opt.emoji}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-5 flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Saltar
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!hasAny}
          title={
            hasAny
              ? "Guardar evaluación en la entrada activa"
              : "Marca al menos un grupo para guardar"
          }
        >
          Guardar
        </Button>
      </div>
    </Modal>
  );
}
