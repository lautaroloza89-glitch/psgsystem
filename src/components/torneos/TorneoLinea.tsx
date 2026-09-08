import Link from "next/link";
import type { Torneo } from "@/types";
import { diasHastaTorneo, estadoTorneo, formatRangoFechasTorneo } from "@/lib/torneos/fechas";
import { ICONO_TIPO_TORNEO } from "@/lib/torneos/tipo";

/**
 * El próximo evento del calendario, en una línea al pie del inicio.
 *
 * Es la versión chica de `TorneoDestacado`, que sigue usándose donde el evento
 * es el protagonista. Acá baja de jerarquía a propósito: es información, no una
 * acción, y arriba va lo que hay que atender. Sigue siendo para todos los roles.
 */
export function TorneoLinea({
  torneo,
  hoy,
}: {
  torneo: Pick<Torneo, "id" | "nombre" | "tipo" | "lugar" | "fecha_inicio" | "fecha_fin">;
  hoy: string;
}) {
  const estado = estadoTorneo(torneo.fecha_inicio, torneo.fecha_fin, hoy);
  const dias = diasHastaTorneo(torneo.fecha_inicio, hoy);

  const cuando =
    estado === "En curso"
      ? "En curso"
      : dias === 0
        ? "Es hoy"
        : dias === 1
          ? "Es mañana"
          : `En ${dias} días`;

  return (
    <Link
      href={`/torneos/${torneo.id}`}
      className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 transition duration-[var(--duration-base)] ease-standard hover:border-primary-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <span aria-hidden="true" className="flex-none text-xl">
        {ICONO_TIPO_TORNEO[torneo.tipo]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold leading-snug">{torneo.nombre}</span>
        <span className="block truncate text-sm text-text-subtle">
          {cuando} · {formatRangoFechasTorneo(torneo.fecha_inicio, torneo.fecha_fin)}
          {torneo.lugar ? ` · ${torneo.lugar}` : ""}
        </span>
      </span>
      <span aria-hidden="true" className="flex-none text-text-subtle">
        ›
      </span>
    </Link>
  );
}
