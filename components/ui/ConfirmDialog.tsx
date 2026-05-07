"use client";

import { Modal } from "./Modal";
import { Button } from "./Button";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "primary" | "danger";
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = "primary",
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
    >
      <div className="flex justify-end gap-2 mt-2">
        {cancelLabel ? (
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
        ) : null}
        <Button variant={variant} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
