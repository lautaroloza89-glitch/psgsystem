import Link from "next/link";
import type { Torneo } from "@/types";
import { ChipTipoTorneo } from "./ChipTipoTorneo";
import { EstadoTorneoBadge } from "./EstadoTorneoBadge";
import { estadoTorneo } from "@/lib/torneos/fechas";
import { Icono } from "@/components/ui/Icono";
import { diaIsoDeFecha, nombreDia } from "@/lib/utils/date";

/**
 * Un evento en la lista: día grande a la izquierda, nombre y tipo al medio.
 *
 * Reemplaza a `TorneoCard`, que repetía el badge de estado en cada tarjeta
 * («Pasado», «Pasado», «Próximo»…) aunque la lista entera fuera de lo mismo.
 * Ahora el estado lo dice la pestaña y el mes lo dice el encabezado del grupo,
 * así que la fila solo trae lo que cambia de una a otra. El badge sobrevive
 * para «En curso», que sí es información urgente.
 */
export function TorneoFila({
  torneo,
  hoy,
}: {
  torneo: Pick<Torneo, "id" | "nombre" | "tipo" | "lugar" | "fecha_inicio" | "fecha_fin"> & {
    notas: string | null;
  };
  hoy: string;
}) {
  const estado = estadoTorneo(torneo.fecha_inicio, torneo.fecha_fin, hoy);
  const dia = Number(torneo.fecha_inicio.slice(8, 10));

  return (
    <li>
      <Link
        href={`/torneos/${torneo.id}`}
        className="flex items-center gap-3 p-4 transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset"
      >
        <span className="flex w-11 flex-none flex-col items-center">
          <span className="text-lg font-semibold tabular-nums">{dia}</span>
          <span className="text-xs uppercase text-text-subtle">
            {nombreDia(diaIsoDeFecha(torneo.fecha_inicio)).slice(0, 3).toLowerCase()}
          </span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold leading-snug">{torneo.nombre}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-subtle">
            <ChipTipoTorneo tipo={torneo.tipo} />
            <span className="truncate">{torneo.lugar ?? "En el club"}</span>
            {estado === "En curso" && <EstadoTorneoBadge estado="En curso" />}
          </span>
        </span>

        {torneo.notas && (
          <>
            <Icono nombre="note" className="h-5 w-5 flex-none text-text-subtle" />
            <span className="sr-only">Tiene notas</span>
          </>
        )}
        <span aria-hidden="true" className="flex-none text-text-subtle">
          ›
        </span>
      </Link>
    </li>
  );
}
