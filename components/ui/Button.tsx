"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/utils/cx";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-rbx-primary text-white hover:bg-rbx-primary-dark focus-visible:outline-rbx-primary",
  secondary:
    "bg-white text-rbx-primary border border-rbx-border hover:bg-rbx-surface-muted focus-visible:outline-rbx-primary",
  ghost:
    "bg-transparent text-rbx-text-primary hover:bg-rbx-surface-muted focus-visible:outline-rbx-primary",
  danger:
    "bg-rbx-error text-white hover:brightness-95 focus-visible:outline-rbx-error",
  accent:
    "bg-rbx-accent text-rbx-text-primary hover:brightness-95 focus-visible:outline-rbx-accent",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-base gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  leadingIcon,
  trailingIcon,
  fullWidth,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={cx(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "min-h-[44px] sm:min-h-0",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}
