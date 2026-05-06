"use client";

import { cn } from "@/lib/utils/cn";
import type { Pod } from "@/lib/pods/create-pods";

type Props = {
  pod: Pod;
  size?: "sm" | "md";
  withDot?: boolean;
  className?: string;
};

export function PodBadge({ pod, size = "sm", withDot = false, className }: Props) {
  const textColor = pod.color.textOn === "white" ? "#ffffff" : "#0f172a";
  const sizeCls =
    size === "sm" ? "text-[10px] px-1.5 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded font-bold tracking-wide whitespace-nowrap shrink-0",
        sizeCls,
        className,
      )}
      style={{ backgroundColor: pod.color.hex, color: textColor }}
    >
      {withDot && (
        <span
          className="inline-block size-2 rounded-full"
          style={{ backgroundColor: textColor, opacity: 0.9 }}
          aria-hidden
        />
      )}
      POD {pod.letter}
    </span>
  );
}

export function PodColorDot({ pod, className }: { pod: Pod; className?: string }) {
  return (
    <span
      className={cn("inline-block size-3 rounded-full shrink-0", className)}
      style={{ backgroundColor: pod.color.hex }}
      aria-hidden
    />
  );
}
