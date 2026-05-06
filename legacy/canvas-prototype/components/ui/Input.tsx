"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/utils/cx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: ReactNode;
}

export function Input({
  className,
  leadingIcon,
  ...rest
}: InputProps) {
  return (
    <div className="relative w-full">
      {leadingIcon && (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-rbx-text-secondary">
          {leadingIcon}
        </span>
      )}
      <input
        {...rest}
        className={cx(
          "block w-full rounded-lg border border-rbx-border bg-white text-rbx-text-primary",
          "placeholder:text-rbx-text-secondary",
          "h-10 text-sm px-3",
          leadingIcon && "pl-9",
          "focus:outline-none focus:ring-2 focus:ring-rbx-primary/40 focus:border-rbx-primary",
          "disabled:opacity-60 disabled:bg-rbx-surface-muted",
          className,
        )}
      />
    </div>
  );
}
