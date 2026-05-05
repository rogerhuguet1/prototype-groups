"use client";

import {
  selectUnassignedStudents,
  useGroupingStore,
} from "@/lib/store/use-grouping-store";
import { Badge } from "@/components/ui/Badge";
import { t } from "@/lib/i18n/strings";

export function UnassignedCounter() {
  const count = useGroupingStore(
    (s) => selectUnassignedStudents(s).length,
  );
  return (
    <Badge tone={count === 0 ? "success" : "info"}>
      {count === 0 ? t.sidebar.counter_all_assigned : t.sidebar.counter(count)}
    </Badge>
  );
}
