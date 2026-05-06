"use client";

import { useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id"> & {
  label: string;
};

export function Checkbox({ label, className, ...rest }: Props) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex items-center gap-2 cursor-pointer select-none",
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="size-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
        {...rest}
      />
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
  );
}
