export type PodColor = {
  hex: string;
  name: string;
  textOn: "white" | "black";
};

export const POD_COLORS: readonly PodColor[] = [
  { hex: "#dc2626", name: "red", textOn: "white" },
  { hex: "#ea580c", name: "orange", textOn: "white" },
  { hex: "#facc15", name: "yellow", textOn: "black" },
  { hex: "#65a30d", name: "lime", textOn: "white" },
  { hex: "#15803d", name: "green", textOn: "white" },
  { hex: "#0f766e", name: "teal", textOn: "white" },
  { hex: "#0284c7", name: "sky", textOn: "white" },
  { hex: "#1d4ed8", name: "blue", textOn: "white" },
  { hex: "#1e3a8a", name: "navy", textOn: "white" },
  { hex: "#5b21b6", name: "purple", textOn: "white" },
  { hex: "#c026d3", name: "fuchsia", textOn: "white" },
  { hex: "#db2777", name: "pink", textOn: "white" },
  { hex: "#9f1239", name: "rose", textOn: "white" },
  { hex: "#92400e", name: "brown", textOn: "white" },
  { hex: "#475569", name: "slate", textOn: "white" },
] as const;

export function colorForPodIndex(index: number): PodColor {
  return POD_COLORS[index % POD_COLORS.length] ?? POD_COLORS[0]!;
}
