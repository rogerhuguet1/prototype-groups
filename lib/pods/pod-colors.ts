export type PodColor = {
  hex: string;
  name: string;
  textOn: "white" | "black";
};

// `textOn` calculado por contraste WCAG con el bg correspondiente.
// Colores claros (orange, lime, sky, violet, gray) usan texto negro porque
// con blanco quedaban por debajo de 4.5:1 (AA texto normal).
export const POD_COLORS: readonly PodColor[] = [
  { hex: "#e53e3e", name: "red", textOn: "white" },
  { hex: "#dd6b20", name: "orange", textOn: "black" },
  { hex: "#d69e2e", name: "yellow", textOn: "black" },
  { hex: "#48bb78", name: "lime", textOn: "black" },
  { hex: "#2f855a", name: "green", textOn: "white" },
  { hex: "#319795", name: "teal", textOn: "white" },
  { hex: "#4299e1", name: "sky", textOn: "black" },
  { hex: "#3182ce", name: "blue", textOn: "white" },
  { hex: "#2c5282", name: "navy", textOn: "white" },
  { hex: "#5a67d8", name: "indigo", textOn: "white" },
  { hex: "#9f7aea", name: "violet", textOn: "black" },
  { hex: "#805ad5", name: "purple", textOn: "white" },
  { hex: "#d53f8c", name: "pink", textOn: "white" },
  { hex: "#a0522d", name: "sienna", textOn: "white" },
  { hex: "#718096", name: "gray", textOn: "black" },
] as const;

export function colorForPodIndex(index: number): PodColor {
  return POD_COLORS[index % POD_COLORS.length] ?? POD_COLORS[0]!;
}
