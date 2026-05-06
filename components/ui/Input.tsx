"use client";

import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  error?: string;
  hint?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, className, ...rest }, ref) => {
    const reactId = useId();
    const inputId = `input-${reactId}`;
    const errorId = `${inputId}-err`;
    const hintId = `${inputId}-hint`;
    return (
      <div className="space-y-1">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? errorId : hint ? hintId : undefined
          }
          className={cn(
            "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2",
            error
              ? "border-rose-400 bg-rose-50 focus:ring-rose-400"
              : "border-slate-300 bg-white focus:ring-blue-500 focus:border-blue-500",
            className,
          )}
          {...rest}
        />
        {error ? (
          <p id={errorId} className="text-xs text-rose-600">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-xs text-slate-500">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";
