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

type SizeStyle = {
  title: string;
  name: string;
  pad: string;
};

function colsFor(n: number): number {
  if (n <= 1) return 1;
  if (n <= 2) return 2;
  if (n <= 4) return 2;
  if (n <= 9) return 3;
  if (n <= 12) return 4;
  return 5;
}

function sizeFor(n: number): SizeStyle {
  if (n <= 4) {
    return {
      title: "text-4xl md:text-5xl",
      name: "text-lg md:text-xl",
      pad: "p-6",
    };
  }
  if (n <= 9) {
    return {
      title: "text-2xl md:text-3xl",
      name: "text-base md:text-lg",
      pad: "p-4",
    };
  }
  return {
    title: "text-xl md:text-2xl",
    name: "text-xs md:text-sm",
    pad: "p-3",
  };
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
  const size = sizeFor(visiblePods.length);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Modo proyección de grupos"
      className={`fixed inset-0 z-[100] bg-slate-900/85 backdrop-blur-sm overflow-y-auto transition-opacity duration-200 motion-reduce:transition-none ${
        entered ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar modo proyección"
        className="fixed top-4 right-4 z-[110] p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
      >
        <X className="size-6" aria-hidden />
      </button>
      <div
        className={`min-h-screen p-6 md:p-8 grid gap-4 md:gap-6 auto-rows-fr transition-transform duration-250 motion-reduce:transition-none ${
          entered ? "scale-100" : "scale-95"
        }`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        onClick={(e) => e.stopPropagation()}
      >
        {visiblePods.map((pod) => (
          <ProjectionCard key={pod.id} pod={pod} size={size} />
        ))}
      </div>
    </div>,
    document.body,
  );
}

function ProjectionCard({ pod, size }: { pod: Pod; size: SizeStyle }) {
  const sorted = sortByLastName(pod.students);
  return (
    <div
      className={`rounded-2xl bg-white flex flex-col items-center justify-start text-center shadow-2xl ${size.pad}`}
      style={{ border: `4px solid ${pod.color.hex}` }}
    >
      <div
        className={`font-extrabold uppercase tracking-wider mb-3 px-4 py-2 rounded-full ${size.title}`}
        style={{
          backgroundColor: pod.color.hex,
          color: pod.color.textOn === "white" ? "#ffffff" : "#0f172a",
        }}
      >
        {pod.name}
      </div>
      <ul
        className={`space-y-1 font-semibold text-slate-800 ${size.name}`}
      >
        {sorted.map((s) => (
          <li key={s.id}>{displayName(s.full_name)}</li>
        ))}
      </ul>
    </div>
  );
}
