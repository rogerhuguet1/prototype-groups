import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VisualGroups — Prototipo",
  description:
    "Prototipo funcional de VisualGroups. Plugin para Moodle Workplace 4.5 — by ROBOTIX.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0057A8",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      {/*
        suppressHydrationWarning en <body> evita el ruido de extensiones del
        navegador (Bitdefender, Grammarly, etc.) que inyectan atributos como
        `bis_register` / `__processed_*` antes de que React hidrate. Sólo
        afecta al body — los mismatches reales en hijos siguen avisando.
      */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
