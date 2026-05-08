"use client";

import { SegmentedControl } from "../ui/SegmentedControl";
import { usePodsStore, type SortMode } from "@/store/pods-store";

const OPTIONS: readonly { value: SortMode; label: string }[] = [
  { value: "alphabetical", label: "Alfabético" },
  { value: "grouped", label: "Por grupos" },
] as const;

export function PodSortControl() {
  const sortMode = usePodsStore((s) => s.sortMode);
  const setSortMode = usePodsStore((s) => s.setSortMode);

  return (
    <SegmentedControl
      options={OPTIONS}
      value={sortMode}
      onChange={setSortMode}
      ariaLabel="Modo de ordenación"
    />
  );
}
