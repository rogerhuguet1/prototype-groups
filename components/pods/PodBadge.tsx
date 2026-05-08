"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Pod } from "@/lib/pods/create-pods";

type Props = {
  pod: Pod;
  size?: "sm" | "md";
  prefix?: string;
  withChevron?: boolean;
  className?: string;
  title?: string;
};

const SIZES = {
  sm: {
    circle: 22,
    emoji: "text-[15px]",
    gap: "gap-1.5",
    text: "text-[11px]",
  },
  md: {
    circle: 28,
    emoji: "text-[19px]",
    gap: "gap-2",
    text: "text-xs",
  },
} as const;

export function PodBadge({
  pod,
  size = "sm",
  prefix,
  withChevron = false,
  className,
  title,
}: Props) {
  const s = SIZES[size];
  return (
    <span
      title={title ?? `Grupo del ${pod.emojiLabel}`}
      className={cn(
        "inline-flex items-center whitespace-nowrap shrink-0 leading-none",
        s.gap,
        className,
      )}
    >
      {prefix ? (
        <span className={cn("font-bold tracking-wide text-slate-800", s.text)}>
          {prefix}
        </span>
      ) : null}
      <span
        className="inline-flex items-center justify-center rounded-full bg-white shrink-0"
        style={{
          width: s.circle,
          height: s.circle,
          borderColor: pod.color.hex,
          borderWidth: 2,
          borderStyle: "solid",
          boxShadow: `0 0 0 1px ${pod.color.hex}30`,
        }}
      >
        <span
          className={cn("leading-none", s.emoji)}
          style={{ filter: "saturate(1.1)" }}
        >
          {pod.emoji}
        </span>
      </span>
      {withChevron ? (
        <ChevronDown className="size-3 shrink-0 text-slate-500" aria-hidden />
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
