"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "@/lib/utils/cx";
import { t } from "@/lib/i18n/strings";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Footer con botones de acción. */
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-rbx-text-primary/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={cx(
          "relative z-10 w-full max-w-md rounded-xl bg-white shadow-elev-2",
          "outline-none",
        )}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-2">
          <h2 id="modal-title" className="text-lg font-semibold text-rbx-text-primary">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.a11y.close}
            className="rounded-md p-1 text-rbx-text-secondary hover:bg-rbx-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rbx-primary"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-3 text-sm text-rbx-text-primary">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-rbx-border px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
