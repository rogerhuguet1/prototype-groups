"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/utils/cx";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** ARIA label obligatorio (botón sin texto). */
  label: string;
  children: ReactNode;
  variant?: "ghost" | "danger" | "primary";
}

export function IconButton({
  label,
  children,
  variant = "ghost",
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex items-center justify-center rounded-lg transition-colors",
        "h-9 w-9 sm:h-8 sm:w-8",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rbx-primary",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "ghost" && "text-rbx-text-secondary hover:bg-rbx-surface-muted",
        variant === "danger" && "text-rbx-error hover:bg-rbx-error/10",
        variant === "primary" && "text-rbx-primary hover:bg-rbx-primary/10",
        className,
      )}
    >
      {children}
    </button>
  );
}
