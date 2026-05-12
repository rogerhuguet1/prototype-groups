"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Pod } from "@/lib/pods/create-pods";

type Props = {
  pod: Pod;
  size?: "sm" | "md";
  withChevron?: boolean;
  className?: string;
  title?: string;
};

const SIZES = {
  sm: {
    pad: "px-2 py-0.5",
    text: "text-[10px]",
    gap: "gap-1",
  },
  md: {
    pad: "px-2.5 py-1",
    text: "text-xs",
    gap: "gap-1.5",
  },
} as const;

export function PodBadge({
  pod,
  size = "sm",
  withChevron = false,
  className,
  title,
}: Props) {
  const s = SIZES[size];
  const textColor = pod.color.textOn === "white" ? "#ffffff" : "#0f172a";
  return (
    <span
      title={title ?? `Grupo ${pod.name}`}
      className={cn(
        "inline-flex items-center whitespace-nowrap shrink-0 leading-none rounded-full font-bold uppercase tracking-wider",
        s.pad,
        s.text,
        s.gap,
        className,
      )}
      style={{ backgroundColor: pod.color.hex, color: textColor }}
    >
      <span>{pod.name}</span>
      {withChevron ? (
        <ChevronDown className="size-3 shrink-0 opacity-75" aria-hidden />
      ) : null}
    </span>
  );
}

export function PodColorDot({
  pod,
  className,
}: {
  pod: Pod;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-block size-3 rounded-full shrink-0", className)}
      style={{ backgroundColor: pod.color.hex }}
      aria-hidden
    />
  );
}
