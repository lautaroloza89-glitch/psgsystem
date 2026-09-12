import { NotificacionesBell } from "@/components/notificaciones/NotificacionesBell";
import { fechaLargaDeHoy } from "@/lib/utils/date";
import type { User } from "@/types";

/**
 * El saludo reemplaza al título «Dashboard»: fijo, en inglés e igual para los
 * seis roles. La navegación se fue a `BarraPestanas` (abajo, siempre visible),
 * así que acá ya no queda ningún `☰`.
 *
 * Dejó de ser un componente de cliente: sin el cajón no hay estado que manejar,
 * y la campana ya trae el suyo.
 */
export function AppHeader({ profile }: { profile: User }) {
  const primerNombre = profile.nombre.split(" ")[0];

  return (
    // El `pt-` del área segura es la contraparte de `viewport-fit=cover`: en la
    // pantalla de inicio de un iPhone el contenido se dibuja debajo de la barra
    // de estado, así que sin esto la hora y la señal taparían el saludo. El
    // fondo del encabezado sube y cubre esa franja.
    <header className="border-b border-border bg-surface pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
        <div className="min-w-0">
          <p className="truncate text-xl font-bold tracking-tight sm:text-2xl">
            Hola, {primerNombre}
          </p>
          <p className="truncate text-sm text-text-subtle">{fechaLargaDeHoy()}</p>
        </div>
        <NotificacionesBell usuarioId={profile.id} />
      </div>
    </header>
  );
}
