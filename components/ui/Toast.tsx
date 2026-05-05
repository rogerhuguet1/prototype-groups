"use client";

import { useGroupingStore } from "@/lib/store/use-grouping-store";
import type { ToastKind } from "@/lib/domain/types";
import { cx } from "@/lib/utils/cx";
import { t } from "@/lib/i18n/strings";

const TONE: Record<ToastKind, string> = {
  success: "bg-white border-rbx-success/40 text-rbx-text-primary",
  info: "bg-white border-rbx-info/40 text-rbx-text-primary",
  warning: "bg-white border-rbx-warning/40 text-rbx-text-primary",
  error: "bg-white border-rbx-error/40 text-rbx-text-primary",
};

const ICON: Record<ToastKind, string> = {
  success: "✓",
  info: "i",
  warning: "!",
  error: "×",
};

const ICON_TONE: Record<ToastKind, string> = {
  success: "bg-rbx-success/15 text-rbx-success",
  info: "bg-rbx-info/15 text-rbx-info",
  warning: "bg-rbx-warning/15 text-rbx-warning",
  error: "bg-rbx-error/15 text-rbx-error",
};

export function ToastStack() {
  const toasts = useGroupingStore((s) => s.toasts);
  const dismiss = useGroupingStore((s) => s.dismissToast);
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.kind === "error" ? "alert" : "status"}
          className={cx(
            "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-elev-1",
            TONE[toast.kind],
          )}
        >
          <span
            aria-hidden
            className={cx(
              "mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
              ICON_TONE[toast.kind],
            )}
          >
            {ICON[toast.kind]}
          </span>
          <p className="flex-1 text-sm leading-snug">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label={t.a11y.close}
            className="text-rbx-text-secondary hover:text-rbx-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rbx-primary rounded"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
