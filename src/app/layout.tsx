import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Patín Saint Germain",
    template: "%s · Patín Saint Germain",
  },
  description: "App de gestión para escuela de patín",
  // El manifest existía en `public/` desde el arranque pero no lo enlazaba
  // nadie, así que el navegador nunca lo leía.
  manifest: "/manifest.json",
  // iPhone: sin esto, el ícono de la pantalla de inicio abre una ventana de
  // Safari en vez de la app.
  appleWebApp: { capable: true, title: "Patín SG", statusBarStyle: "default" },
};

/**
 * `viewportFit: "cover"` es lo que hace que `env(safe-area-inset-bottom)`
 * devuelva un valor real. Sin él vale **0**, y la barra de pestañas —que lo usa
 * para su padding— quedaba pegada al borde de abajo, debajo de la barra de
 * gestos del iPhone.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f7f5f0",
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
