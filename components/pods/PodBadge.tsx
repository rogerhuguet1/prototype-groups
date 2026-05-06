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
};

export function PodBadge({
  pod,
  size = "sm",
  prefix,
  withChevron = false,
  className,
}: Props) {
  const textColor = pod.color.textOn === "white" ? "#ffffff" : "#0f172a";
  const sizeCls =
    size === "sm" ? "text-[11px] px-1.5 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5";
  return (
    <span
      title={`Grupo del ${pod.emojiLabel}`}
      className={cn(
        "inline-flex items-center rounded font-bold tracking-wide whitespace-nowrap shrink-0 leading-none",
        sizeCls,
        className,
      )}
      style={{ backgroundColor: pod.color.hex, color: textColor }}
    >
      {prefix ? <span>{prefix}</span> : null}
      <span className="text-[13px] leading-none">{pod.emoji}</span>
      {withChevron ? (
        <ChevronDown className="size-3 shrink-0" aria-hidden />
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
