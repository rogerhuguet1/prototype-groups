export type PodColor = {
  hex: string;
  name: string;
  textOn: "white" | "black";
};

// Paleta de 15 colores oscuros (Tailwind 700/800) elegidos para contrastar
// >= 4.5:1 con texto BLANCO (AA texto normal). Todos usan textOn: 'white'.
export const POD_COLORS: readonly PodColor[] = [
  { hex: "#b91c1c", name: "red", textOn: "white" },       // red-700      6.14
  { hex: "#c2410c", name: "orange", textOn: "white" },    // orange-700   4.77
  { hex: "#92400e", name: "amber", textOn: "white" },     // amber-800    7.00
  { hex: "#4d7c0f", name: "lime", textOn: "white" },      // lime-700     4.57
  { hex: "#15803d", name: "green", textOn: "white" },     // green-700    4.77
  { hex: "#047857", name: "emerald", textOn: "white" },   // emerald-700  4.95
  { hex: "#0f766e", name: "teal", textOn: "white" },      // teal-700     4.95
  { hex: "#0e7490", name: "cyan", textOn: "white" },      // cyan-700     4.77
  { hex: "#0369a1", name: "sky", textOn: "white" },       // sky-700      5.25
  { hex: "#1d4ed8", name: "blue", textOn: "white" },      // blue-700     5.83
  { hex: "#4338ca", name: "indigo", textOn: "white" },    // indigo-700   6.56
  { hex: "#6d28d9", name: "violet", textOn: "white" },    // violet-700   6.56
  { hex: "#7e22ce", name: "purple", textOn: "white" },    // purple-700   6.25
  { hex: "#a21caf", name: "fuchsia", textOn: "white" },   // fuchsia-700  5.83
  { hex: "#be185d", name: "pink", textOn: "white" },      // pink-700     5.25
] as const;

export function colorForPodIndex(index: number): PodColor {
  return POD_COLORS[index % POD_COLORS.length] ?? POD_COLORS[0]!;
}
