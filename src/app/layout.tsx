import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Escuela de Patín",
  description: "App de gestión para escuela de patín",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
