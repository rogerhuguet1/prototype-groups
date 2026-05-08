export type PodColor = {
  hex: string;
  name: string;
  textOn: "white" | "black";
};

export const POD_COLORS: readonly PodColor[] = [
  { hex: "#e53e3e", name: "red", textOn: "white" },
  { hex: "#dd6b20", name: "orange", textOn: "white" },
  { hex: "#d69e2e", name: "yellow", textOn: "black" },
  { hex: "#48bb78", name: "lime", textOn: "white" },
  { hex: "#2f855a", name: "green", textOn: "white" },
  { hex: "#319795", name: "teal", textOn: "white" },
  { hex: "#4299e1", name: "sky", textOn: "white" },
  { hex: "#3182ce", name: "blue", textOn: "white" },
  { hex: "#2c5282", name: "navy", textOn: "white" },
  { hex: "#5a67d8", name: "indigo", textOn: "white" },
  { hex: "#9f7aea", name: "violet", textOn: "white" },
  { hex: "#805ad5", name: "purple", textOn: "white" },
  { hex: "#d53f8c", name: "pink", textOn: "white" },
  { hex: "#a0522d", name: "sienna", textOn: "white" },
  { hex: "#718096", name: "gray", textOn: "white" },
] as const;

export function colorForPodIndex(index: number): PodColor {
  return POD_COLORS[index % POD_COLORS.length] ?? POD_COLORS[0]!;
}
