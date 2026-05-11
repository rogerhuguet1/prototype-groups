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
  primary:
    "bg-c360-blue hover:bg-c360-blue-dark text-white border-c360-blue uppercase tracking-wider",
  secondary:
    "bg-white hover:bg-c360-blue hover:text-white text-c360-blue border-[1.5px] border-c360-blue uppercase tracking-wider",
  danger:
    "bg-grade-fail hover:bg-grade-fail/90 text-white border-grade-fail",
  ghost:
    "bg-transparent hover:bg-c360-blue/5 text-c360-text border-transparent",
};

const SIZES: Record<Size, string> = {
  sm: "text-xs px-4 py-1.5",
  md: "text-sm px-6 py-2.5",
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "primary", size = "md", className, type = "button", ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center gap-1.5 font-bold rounded-full border transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    />
  ),
);
Button.displayName = "Button";
