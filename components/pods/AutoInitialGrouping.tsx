"use client";

import { useEffect, useRef } from "react";
import { usePodsStore } from "@/store/pods-store";
import { useHistoryStore } from "@/store/history-store";
import { MAX_PODS } from "@/lib/pods/pod-emojis";
import type { StudentRow } from "@/types/database";

export function defaultRobotCount(studentsCount: number): number {
  return Math.min(MAX_PODS, Math.max(1, Math.ceil(studentsCount / 4)));
}

type Props = {
  students: StudentRow[];
  classId: string | null;
};

export function AutoInitialGrouping({ students, classId }: Props) {
  const initRanRef = useRef(false);

  useEffect(() => {
    if (initRanRef.current) return;
    if (students.length === 0) return;

    const tryInit = () => {
      if (initRanRef.current) return;
      if (!usePodsStore.persist.hasHydrated()) return;
      if (!useHistoryStore.persist.hasHydrated()) return;

      const podsState = usePodsStore.getState();
      const historyState = useHistoryStore.getState();

      if (
        podsState.pods.length > 0 ||
        historyState.entries.length > 0
      ) {
        initRanRef.current = true;
        return;
      }
      initRanRef.current = true;

      const robotCount = defaultRobotCount(students.length);
      const result = podsState.createPodsFromInput({
        students: students.map((s) => ({
          id: s.id,
          full_name: s.full_name,
        })),
        presentCount: students.length,
        robotCount,
        classId,
      });
      const entryId = crypto.randomUUID();
      historyState.addEntry({
        id: entryId,
        timestamp: new Date().toISOString(),
        classId,
        presentStudents: students.length,
        robotCount,
        seed: result.seed,
        pods: result.pods,
        isFavorite: false,
        label: "Asignación inicial",
      });
      podsState.setCurrentEntryId(entryId);
    };

    tryInit();
    const unsub1 = usePodsStore.persist.onFinishHydration(tryInit);
    const unsub2 = useHistoryStore.persist.onFinishHydration(tryInit);
    return () => {
      unsub1();
      unsub2();
    };
  }, [students, classId]);

  return null;
}
