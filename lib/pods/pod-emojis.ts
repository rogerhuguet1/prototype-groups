export type PodEmoji = {
  emoji: string;
  label: string;
};

export const POD_EMOJIS: readonly PodEmoji[] = [
  { emoji: "🤖", label: "Robot" },
  { emoji: "⚙️", label: "Engranaje" },
  { emoji: "🚀", label: "Cohete" },
  { emoji: "🛰️", label: "Satélite" },
  { emoji: "🔬", label: "Microscopio" },
  { emoji: "🧪", label: "Probeta" },
  { emoji: "🔭", label: "Telescopio" },
  { emoji: "💡", label: "Bombilla" },
  { emoji: "🧲", label: "Imán" },
  { emoji: "🔋", label: "Batería" },
  { emoji: "💻", label: "Ordenador" },
  { emoji: "🛠️", label: "Herramientas" },
  { emoji: "🧠", label: "Cerebro" },
  { emoji: "🔌", label: "Enchufe" },
  { emoji: "🦾", label: "Brazo robótico" },
] as const;

export const MAX_PODS = POD_EMOJIS.length;
