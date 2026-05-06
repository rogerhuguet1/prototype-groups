export type PodColor = {
  hex: string;
  name: string;
  textOn: "white" | "black";
};

export const POD_COLORS: readonly PodColor[] = [
  { hex: "#0ea5e9", name: "sky", textOn: "white" },
  { hex: "#10b981", name: "emerald", textOn: "white" },
  { hex: "#f59e0b", name: "amber", textOn: "black" },
  { hex: "#f43f5e", name: "rose", textOn: "white" },
  { hex: "#8b5cf6", name: "violet", textOn: "white" },
  { hex: "#84cc16", name: "lime", textOn: "black" },
  { hex: "#f97316", name: "orange", textOn: "white" },
  { hex: "#06b6d4", name: "cyan", textOn: "black" },
  { hex: "#d946ef", name: "fuchsia", textOn: "white" },
  { hex: "#14b8a6", name: "teal", textOn: "white" },
  { hex: "#6366f1", name: "indigo", textOn: "white" },
  { hex: "#ef4444", name: "red", textOn: "white" },
] as const;

export function colorForPodIndex(index: number): PodColor {
  return POD_COLORS[index % POD_COLORS.length] ?? POD_COLORS[0]!;
}
