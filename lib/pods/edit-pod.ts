import type { Pod } from "./create-pods";

export type ChangeEmojiError = "pod-not-found" | "emoji-in-use";

export type ChangeEmojiResult =
  | { ok: true; pods: Pod[] }
  | { ok: false; reason: ChangeEmojiError };

export const CHANGE_EMOJI_ERROR_MESSAGES: Record<ChangeEmojiError, string> = {
  "pod-not-found": "El grupo no existe",
  "emoji-in-use": "Ese emoji ya está en uso por otro grupo",
};

export function changePodEmoji(
  pods: Pod[],
  podId: string,
  emoji: string,
  emojiLabel: string,
): ChangeEmojiResult {
  const target = pods.find((p) => p.id === podId);
  if (!target) return { ok: false, reason: "pod-not-found" };
  if (target.emoji === emoji) return { ok: true, pods };

  const inUse = pods.some((p) => p.id !== podId && p.emoji === emoji);
  if (inUse) return { ok: false, reason: "emoji-in-use" };

  const newPods = pods.map((p) =>
    p.id === podId ? { ...p, emoji, emojiLabel } : p,
  );
  return { ok: true, pods: newPods };
}
