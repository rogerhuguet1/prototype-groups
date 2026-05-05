"use client";

import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  selectPanelById,
  selectStudentsInPanel,
  useGroupingStore,
} from "@/lib/store/use-grouping-store";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EvaluationStateBadge } from "./EvaluationStateBadge";
import { GroupScoreInput } from "./GroupScoreInput";
import { IndividualScoreRow } from "./IndividualScoreRow";
import {
  ALLOWED_EVAL_TRANSITIONS,
  EVAL_STATUS_LABEL,
} from "@/lib/domain/constants";
import {
  formatScore,
  panelAverage,
  panelBaseAverage,
} from "@/lib/domain/grading";
import { t } from "@/lib/i18n/strings";
import { cx } from "@/lib/utils/cx";

interface Props {
  /** En tablet/mobile el panel se muestra en sheet/drawer y necesita botón cerrar. */
  onClose?: () => void;
  /** Estilo "drawer" cuando se muestra como overlay en breakpoints estrechos. */
  asOverlay?: boolean;
}

export function DetailPanel({ onClose, asOverlay }: Props) {
  const panelId = useGroupingStore((s) => s.selectedPanelId);
  const panel = useGroupingStore((s) =>
    panelId ? selectPanelById(s, panelId) : undefined,
  );
  const students = useGroupingStore(
    useShallow((s) => (panelId ? selectStudentsInPanel(s, panelId) : [])),
  );
  const evaluation = useGroupingStore((s) =>
    panelId ? s.evaluations[panelId] : undefined,
  );
  const renamePanel = useGroupingStore((s) => s.renamePanel);
  const deletePanel = useGroupingStore((s) => s.deletePanel);
  const changeEvalStatus = useGroupingStore((s) => s.changeEvalStatus);
  const pushToast = useGroupingStore((s) => s.pushToast);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!panel || !panelId) {
    return (
      <aside
        className={cx(
          "flex h-full min-h-0 flex-col rounded-xl border border-rbx-border bg-rbx-surface p-6",
          asOverlay && "shadow-elev-2",
        )}
      >
        <p className="text-sm text-rbx-text-secondary">{t.detail.no_selection}</p>
      </aside>
    );
  }

  const studentIds = students.map((s) => s.id);
  const avg = panelAverage(evaluation, studentIds);
  const baseAvg = panelBaseAverage(students);
  const allowed = ALLOWED_EVAL_TRANSITIONS[evaluation?.status ?? "pending"];

  return (
    <aside
      className={cx(
        "flex h-full min-h-0 flex-col rounded-xl border border-rbx-border bg-rbx-surface",
        asOverlay && "shadow-elev-2",
      )}
      aria-labelledby="detail-title"
    >
      <header className="flex items-start justify-between gap-3 border-b border-rbx-border p-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-rbx-text-secondary">
            {t.detail.title}
          </p>
          <h2
            id="detail-title"
            className="truncate text-lg font-semibold text-rbx-text-primary"
          >
            {panel.name}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <EvaluationStateBadge status={evaluation?.status ?? "pending"} />
            <Badge tone="info">
              {students.length}/{panel.capacity}
            </Badge>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        )}
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        <section className="grid grid-cols-2 gap-3">
          <Stat
            label={t.detail.average_label}
            value={formatScore(avg)}
            tone="primary"
          />
          <Stat
            label={t.detail.base_average_label}
            value={formatScore(baseAvg)}
          />
        </section>

        <section className="space-y-2 rounded-xl border border-rbx-border bg-white p-3">
          <GroupScoreInput panelId={panelId} />
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-rbx-text-primary">
              {t.detail.individual_label}
            </h3>
            <span className="text-xs text-rbx-text-secondary">
              {t.detail.members_label}: {students.length}
            </span>
          </div>
          {students.length === 0 ? (
            <p className="rounded-lg border border-dashed border-rbx-border p-4 text-center text-sm text-rbx-text-secondary">
              {t.canvas.empty_panel_drop_hint}
            </p>
          ) : (
            <>
              <ul role="list" className="flex flex-col gap-2">
                {students.map((student) => (
                  <IndividualScoreRow
                    key={student.id}
                    panelId={panelId}
                    student={student}
                  />
                ))}
              </ul>
              <p className="mt-2 text-xs text-rbx-text-secondary">
                {t.detail.individual_hint}
              </p>
            </>
          )}
        </section>

        <section className="space-y-2 rounded-xl border border-rbx-border bg-white p-3">
          <p className="text-sm font-medium text-rbx-text-primary">
            {t.detail.eval_state_label}
          </p>
          <div className="flex flex-wrap gap-2">
            {allowed.map((next) => (
              <Button
                key={next}
                variant={next === "published" ? "primary" : "secondary"}
                size="sm"
                onClick={() => changeEvalStatus(panelId, next)}
              >
                {next === "published" && t.detail.publish}
                {next === "draft" && t.detail.to_draft}
                {next === "locked" && t.detail.lock}
                {next === "pending" && EVAL_STATUS_LABEL.pending}
              </Button>
            ))}
            {allowed.length === 0 && (
              <p className="text-xs text-rbx-text-secondary">
                Estado terminal — sólo lectura.
              </p>
            )}
          </div>
        </section>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-rbx-border p-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setRenameDraft(panel.name);
              setRenameOpen(true);
            }}
          >
            {t.detail.rename}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
            {t.detail.delete}
          </Button>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => pushToast("success", t.toast.saved)}
        >
          {t.detail.save_changes}
        </Button>
      </footer>

      <Modal
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title={t.detail.rename}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenameOpen(false)}>
              {t.confirm.cancel}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                renamePanel(panelId, renameDraft);
                setRenameOpen(false);
              }}
            >
              {t.confirm.confirm}
            </Button>
          </>
        }
      >
        <Input
          autoFocus
          value={renameDraft}
          onChange={(e) => setRenameDraft(e.target.value)}
          aria-label={t.detail.rename}
        />
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title={t.confirm.delete_panel_title}
        body={t.confirm.delete_panel_body(panel.name)}
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deletePanel(panelId);
          setConfirmDelete(false);
        }}
      />
    </aside>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "primary";
}) {
  return (
    <div className="rounded-xl border border-rbx-border bg-white p-3">
      <p className="text-xs text-rbx-text-secondary">{label}</p>
      <p
        className={cx(
          "mt-1 text-2xl font-semibold tabular-nums",
          tone === "primary" ? "text-rbx-primary" : "text-rbx-text-primary",
        )}
      >
        {value}
      </p>
    </div>
  );
}
