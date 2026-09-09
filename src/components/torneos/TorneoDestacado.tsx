import Link from "next/link";
import type { Torneo } from "@/types";
import { EstadoTorneoBadge } from "./EstadoTorneoBadge";
import { ChipTipoTorneo } from "./ChipTipoTorneo";
import {
  diasHastaTorneo,
  estadoTorneo,
  formatRangoConDiaDeSemana,
} from "@/lib/torneos/fechas";
import { Icono } from "@/components/ui/Icono";

/**
 * El próximo evento, arriba de todo. Y **solo** arriba: la lista ya no vuelve
 * a mostrarlo, que era lo que hacía antes — la tarjeta destacada y la primera
 * fila del año eran el mismo torneo, uno debajo del otro.
 *
 * «En 8 días» sube a ser el título: es lo que se mira primero.
 */
function textoFaltante(dias: number): string {
  if (dias === 0) return "Es hoy";
  if (dias === 1) return "Es mañana";
  return `Faltan ${dias} días`;
}

export function TorneoDestacado({
  torneo,
  hoy,
  puedeEditar,
}: {
  torneo: Pick<Torneo, "id" | "nombre" | "tipo" | "lugar" | "fecha_inicio" | "fecha_fin"> & {
    notas: string | null;
  };
  hoy: string;
  puedeEditar: boolean;
}) {
  const estado = estadoTorneo(torneo.fecha_inicio, torneo.fecha_fin, hoy);
  const dias = diasHastaTorneo(torneo.fecha_inicio, hoy);

  const boton =
    "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-primary-300 bg-surface px-4 text-sm font-medium text-primary-700 transition-colors duration-[var(--duration-fast)] ease-standard hover:border-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

  return (
    <div className="space-y-4 rounded-xl border border-primary-200 bg-primary-50 p-5 shadow-xs sm:p-6">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">
          {estado === "En curso" ? "En curso" : textoFaltante(dias)}
        </p>
        {estado === "En curso" ? (
          <EstadoTorneoBadge estado="En curso" />
        ) : (
          <ChipTipoTorneo tipo={torneo.tipo} tono="oscuro" />
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          <Link
            href={`/torneos/${torneo.id}`}
            className="hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            {torneo.nombre}
          </Link>
        </h2>
        <p className="mt-1 text-base text-text-muted">
          {formatRangoConDiaDeSemana(torneo.fecha_inicio, torneo.fecha_fin)}
        </p>
        <p className="text-base text-text-muted">{torneo.lugar ?? "En el club"}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {torneo.notas && (
          <Link href={`/torneos/${torneo.id}`} className={boton}>
            <Icono nombre="note" className="h-4 w-4" />
            Ver notas
          </Link>
        )}
        {puedeEditar && (
          <Link href={`/torneos/${torneo.id}/editar`} className={boton}>
            Editar
          </Link>
        )}
      </div>
    </div>
  );
}
