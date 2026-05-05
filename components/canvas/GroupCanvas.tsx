"use client";

import { useState } from "react";
import { useGroupingStore } from "@/lib/store/use-grouping-store";
import { PanelCard } from "./PanelCard";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cx } from "@/lib/utils/cx";
import { t } from "@/lib/i18n/strings";

export function GroupCanvas() {
  const panels = useGroupingStore((s) => s.panels);
  const create = useGroupingStore((s) => s.createPanel);
  const distribute = useGroupingStore((s) => s.distributeAuto);
  const clearAll = useGroupingStore((s) => s.clearAllPanels);

  const [confirmClear, setConfirmClear] = useState(false);

  const sorted = [...panels].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section
      aria-labelledby="canvas-title"
      className="flex h-full min-h-0 flex-col rounded-xl border border-rbx-border bg-rbx-surface"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-rbx-border p-3 sm:p-4">
        <h2 id="canvas-title" className="text-sm font-semibold text-rbx-text-primary">
          {t.canvas.title}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setConfirmClear(true)}
          >
            {t.canvas.clear_all}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => distribute()}>
            {t.canvas.distribute}
          </Button>
          <Button variant="primary" size="sm" onClick={() => create()}>
            + {t.canvas.create_group}
          </Button>
        </div>
      </header>

      <div
        className={cx(
          "min-h-0 flex-1 overflow-y-auto p-3 sm:p-4",
          panels.length === 0 && "flex items-center justify-center",
        )}
      >
        {panels.length === 0 ? (
          <div className="max-w-sm rounded-xl border-2 border-dashed border-rbx-border p-8 text-center">
            <p className="text-sm text-rbx-text-secondary">
              {t.canvas.empty_no_groups}
            </p>
            <div className="mt-4 flex justify-center">
              <Button variant="primary" size="sm" onClick={() => create()}>
                + {t.canvas.create_group}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-x-4 gap-y-6 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))] justify-items-center">
            {sorted.map((panel) => (
              <PanelCard key={panel.id} panel={panel} />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmClear}
        title={t.confirm.clear_all_title}
        body={t.confirm.clear_all_body}
        destructive
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clearAll();
          setConfirmClear(false);
        }}
      />
    </section>
  );
}
