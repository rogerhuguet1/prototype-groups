"use client";

import { useGroupingStore } from "@/lib/store/use-grouping-store";
import type { Student } from "@/lib/domain/types";
import { NumberInput } from "@/components/ui/NumberInput";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fullName } from "@/lib/utils/initials";
import { t } from "@/lib/i18n/strings";

interface Props {
  panelId: string;
  student: Student;
}

export function IndividualScoreRow({ panelId, student }: Props) {
  const evaluation = useGroupingStore((s) => s.evaluations[panelId]);
  const setOverride = useGroupingStore((s) => s.setIndividualOverride);
  const unassign = useGroupingStore((s) => s.unassignStudent);

  const override = evaluation?.individualOverrides[student.id];
  const groupScore = evaluation?.groupScore ?? null;
  const effective = override ?? groupScore;

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-rbx-border bg-white px-3 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Avatar
          firstName={student.firstName}
          lastName={student.lastName}
          score={effective ?? student.baseScore ?? null}
          size="xs"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-rbx-text-primary">
            {fullName(student.firstName, student.lastName)}
          </p>
          {override !== undefined && (
            <Badge tone="accent" className="mt-0.5">
              {t.detail.overridden_badge}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <NumberInput
          compact
          value={override ?? null}
          onCommit={(v) => setOverride(panelId, student.id, v)}
          ariaLabel={t.a11y.score_input(fullName(student.firstName, student.lastName))}
          placeholder={effective !== null ? effective.toFixed(1) : "—"}
        />
        {override !== undefined && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOverride(panelId, student.id, null)}
            title={t.detail.restore_group_score}
          >
            ↺
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => unassign(student.id)}
          title={t.sidebar.return_button}
        >
          ←
        </Button>
      </div>
    </li>
  );
}
