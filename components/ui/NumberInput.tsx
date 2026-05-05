"use client";

import { useEffect, useState } from "react";
import { cx } from "@/lib/utils/cx";

interface NumberInputProps {
  /** Valor en el modelo (puede ser null para "sin nota"). */
  value: number | null;
  onCommit: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
  /** Renderizado más pequeño para listas densas. */
  compact?: boolean;
}

/**
 * Input numérico con commit en blur/Enter.
 * - Acepta vacío (null).
 * - Bloquea valores fuera de rango antes de hacer commit.
 * - El error se muestra como anillo rojo + aria-invalid; el modelo nunca recibe inválido.
 */
export function NumberInput({
  value,
  onCommit,
  min = 0,
  max = 10,
  step = 0.1,
  ariaLabel,
  placeholder = "—",
  className,
  compact,
}: NumberInputProps) {
  const [draft, setDraft] = useState<string>(value === null ? "" : String(value));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setDraft(value === null ? "" : String(value));
    setInvalid(false);
  }, [value]);

  const commit = () => {
    const trimmed = draft.trim().replace(",", ".");
    if (trimmed === "") {
      setInvalid(false);
      onCommit(null);
      return;
    }
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed) || parsed < min || parsed > max) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onCommit(Math.round(parsed * 100) / 100);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        } else if (e.key === "Escape") {
          setDraft(value === null ? "" : String(value));
          setInvalid(false);
          e.currentTarget.blur();
        }
      }}
      aria-label={ariaLabel}
      aria-invalid={invalid}
      placeholder={placeholder}
      step={step}
      className={cx(
        "rounded-md border bg-white text-rbx-text-primary tabular-nums",
        "focus:outline-none focus:ring-2",
        compact ? "h-8 px-2 text-sm w-16" : "h-10 px-3 text-base w-24",
        invalid
          ? "border-rbx-error ring-rbx-error/30 focus:ring-rbx-error/40"
          : "border-rbx-border focus:ring-rbx-primary/40 focus:border-rbx-primary",
        className,
      )}
    />
  );
}
