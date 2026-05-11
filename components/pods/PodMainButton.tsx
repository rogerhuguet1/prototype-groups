"use client";

import { useState } from "react";
import { Shuffle, List } from "lucide-react";
import { Button } from "../ui/Button";
import { PodGroupingModal } from "./PodGroupingModal";
import { usePodsStore } from "@/store/pods-store";
import type { Student } from "@/lib/pods/create-pods";

type Props = {
  students: Student[];
};

export function PodMainButton({ students }: Props) {
  const sortMode = usePodsStore((s) => s.sortMode);
  const setSortMode = usePodsStore((s) => s.setSortMode);
  const [modalOpen, setModalOpen] = useState(false);

  if (students.length === 0) return null;

  if (sortMode === "grouped") {
    return (
      <Button
        variant="secondary"
        onClick={() => setSortMode("alphabetical")}
        className="text-[11px] font-bold uppercase tracking-wider px-3 py-2"
        title="Volver a la lista alfabética"
      >
        <List className="size-3.5" aria-hidden />
        Volver a lista
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setModalOpen(true)}
        className="text-[11px] font-bold uppercase tracking-wider px-3 py-2"
        title="Generar/regenerar agrupación"
      >
        <Shuffle className="size-3.5" aria-hidden />
        Reagrupar
      </Button>
      <PodGroupingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        students={students}
      />
    </>
  );
}
