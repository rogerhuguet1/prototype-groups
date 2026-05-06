"use client";

import { useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { PodBadge } from "./PodBadge";
import { PodEmojiPicker } from "./PodEmojiPicker";
import { usePodsStore } from "@/store/pods-store";
import type { Pod } from "@/lib/pods/create-pods";

type Props = {
  pod: Pod;
};

type Position = { top: number; left: number };

export function PodHeaderTrigger({ pod }: Props) {
  const [position, setPosition] = useState<Position | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { allPods, changeEmoji } = usePodsStore(
    useShallow((s) => ({
      allPods: s.pods,
      changeEmoji: s.changeEmoji,
    })),
  );

  const emojisInUse = useMemo(
    () => new Set(allPods.map((p) => p.emoji)),
    [allPods],
  );

  function toggle() {
    if (position) {
      setPosition(null);
      return;
    }
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition({ top: rect.bottom + 4, left: rect.left });
  }

  function handleSelect(emoji: string, label: string) {
    changeEmoji(pod.id, emoji, label);
    setPosition(null);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={Boolean(position)}
        aria-label={`Cambiar emoji del grupo (actualmente ${pod.emojiLabel})`}
        className="rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <PodBadge pod={pod} size="md" prefix="Grupo" withChevron />
      </button>
      {position && (
        <PodEmojiPicker
          pod={pod}
          emojisInUse={emojisInUse}
          position={position}
          onSelect={handleSelect}
          onClose={() => setPosition(null)}
        />
      )}
    </>
  );
}
