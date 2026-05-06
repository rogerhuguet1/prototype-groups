"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const VARIANTS: Record<Variant, string> = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white border-blue-600",
  secondary:
    "bg-white hover:bg-slate-50 text-slate-800 border-slate-300",
  danger: "bg-rose-600 hover:bg-rose-700 text-white border-rose-600",
  ghost:
    "bg-transparent hover:bg-slate-100 text-slate-700 border-transparent",
};

const SIZES: Record<Size, string> = {
  sm: "text-xs px-2.5 py-1.5",
  md: "text-sm px-4 py-2",
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "primary", size = "md", className, type = "button", ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    />
  ),
);
Button.displayName = "Button";
