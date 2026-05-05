"use client";

import { useGroupingStore } from "@/lib/store/use-grouping-store";
import { NumberInput } from "@/components/ui/NumberInput";
import { t } from "@/lib/i18n/strings";

export function GroupScoreInput({ panelId }: { panelId: string }) {
  const score = useGroupingStore((s) => s.evaluations[panelId]?.groupScore ?? null);
  const setScore = useGroupingStore((s) => s.setGroupScore);
  const status = useGroupingStore((s) => s.evaluations[panelId]?.status ?? "pending");
  const locked = status === "locked";

  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm text-rbx-text-secondary">
        {t.detail.group_score_label}
      </label>
      <NumberInput
        value={score}
        onCommit={(v) => setScore(panelId, v)}
        ariaLabel={t.detail.group_score_label}
      />
    </div>
  );
}
