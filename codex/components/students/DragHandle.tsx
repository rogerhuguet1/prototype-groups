"use client";

import { GripVertical } from "lucide-react";
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Props = HTMLAttributes<HTMLButtonElement> & {
  label: string;
  disabled?: boolean;
};

export const DragHandle = forwardRef<HTMLButtonElement, Props>(
  ({ label, className, disabled = false, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      className={cn(
        "size-6 inline-flex items-center justify-center rounded touch-none focus:outline-none focus:ring-2 focus:ring-blue-500",
        disabled
          ? "text-slate-300 cursor-not-allowed"
          : "text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-grab active:cursor-grabbing",
        className,
      )}
      {...rest}
    >
      <GripVertical className="size-4" aria-hidden />
    </button>
  ),
);
DragHandle.displayName = "DragHandle";
