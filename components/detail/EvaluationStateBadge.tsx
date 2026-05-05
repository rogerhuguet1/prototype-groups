"use client";

import type { EvaluationStatus } from "@/lib/domain/types";
import { Badge } from "@/components/ui/Badge";
import { EVAL_STATUS_LABEL } from "@/lib/domain/constants";

const TONE: Record<EvaluationStatus, "neutral" | "warning" | "success" | "info"> = {
  pending: "neutral",
  draft: "warning",
  published: "success",
  locked: "info",
};

const ICON: Record<EvaluationStatus, string> = {
  pending: "○",
  draft: "◐",
  published: "●",
  locked: "■",
};

export function EvaluationStateBadge({
  status,
  compact,
}: {
  status: EvaluationStatus;
  compact?: boolean;
}) {
  return (
    <Badge tone={TONE[status]} className={compact ? "text-[11px]" : ""}>
      <span aria-hidden className="font-mono leading-none">
        {ICON[status]}
      </span>
      <span>{EVAL_STATUS_LABEL[status]}</span>
    </Badge>
  );
}
