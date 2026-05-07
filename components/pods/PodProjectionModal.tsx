"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { usePodsStore } from "@/store/pods-store";
import { displayName, sortByLastName } from "@/lib/utils/sort-students";
import type { Pod } from "@/lib/pods/create-pods";

type Props = {
  open: boolean;
  onClose: () => void;
};

function colsFor(n: number): number {
  if (n <= 1) return 1;
  if (n <= 2) return 2;
  if (n <= 4) return 2;
  if (n <= 9) return 3;
  if (n <= 12) return 4;
  return 5;
}

export function PodProjectionModal({ open, onClose }: Props) {
  const pods = usePodsStore((s) => s.pods);
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const t = window.setTimeout(() => setEntered(true), 10);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const visiblePods = pods.filter((p) => p.students.length > 0);
  const cols = colsFor(visiblePods.length);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Modo proyección de grupos"
      className={`fixed inset-0 z-[100] bg-slate-900/85 backdrop-blur-sm flex items-stretch justify-center transition-opacity duration-200 motion-reduce:transition-none ${
        entered ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar modo proyección"
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
      >
        <X className="size-6" aria-hidden />
      </button>
      <div
        className={`m-8 flex-1 grid gap-6 transition-transform duration-250 motion-reduce:transition-none ${
          entered ? "scale-100" : "scale-95"
        }`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        onClick={(e) => e.stopPropagation()}
      >
        {visiblePods.map((pod) => (
          <ProjectionCard key={pod.id} pod={pod} />
        ))}
      </div>
    </div>,
    document.body,
  );
}

function ProjectionCard({ pod }: { pod: Pod }) {
  const sorted = sortByLastName(pod.students);
  return (
    <div
      className="rounded-2xl bg-white flex flex-col items-center justify-start p-6 text-center shadow-2xl"
      style={{ border: `4px solid ${pod.color.hex}` }}
    >
      <div className="text-6xl md:text-7xl lg:text-8xl leading-none mb-2">
        {pod.emoji}
      </div>
      <div
        className="text-xl md:text-2xl lg:text-3xl font-bold mb-3 px-3 py-1 rounded-full"
        style={{
          backgroundColor: pod.color.hex,
          color: pod.color.textOn === "white" ? "#ffffff" : "#0f172a",
        }}
      >
        Grupo {pod.emoji}
      </div>
      <ul className="space-y-1 text-base md:text-lg lg:text-xl font-semibold text-slate-800">
        {sorted.map((s) => (
          <li key={s.id}>{displayName(s.full_name)}</li>
        ))}
      </ul>
    </div>
  );
}
