import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VisualGroups",
  description: "Gestión visual de grupos — ROBOTIX",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
