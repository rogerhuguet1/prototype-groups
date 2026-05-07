"use client";

import { useEffect } from "react";
import { usePodsStore } from "@/store/pods-store";
import { useHistoryStore } from "@/store/history-store";

export function StoresHydrator() {
  useEffect(() => {
    (async () => {
      await usePodsStore.persist.rehydrate();
      await useHistoryStore.persist.rehydrate();
      const pods = usePodsStore.getState().pods;
      const entries = useHistoryStore.getState().entries;
      if (pods.length === 0 && entries.length > 0) {
        const latest = entries[0];
        if (!latest) return;
        const studentsFromSnapshot = latest.pods.flatMap((p) =>
          p.students.map((s) => ({ id: s.id, full_name: s.full_name })),
        );
        usePodsStore.getState().loadFromHistory({
          pods: latest.pods,
          seed: latest.seed,
          classId: latest.classId,
          presentCount: latest.presentStudents,
          robotCount: latest.robotCount,
          students: studentsFromSnapshot,
          lockedStudentIds: latest.lockedStudentIds,
          entryId: latest.id,
        });
      }
    })();
  }, []);
  return null;
}
