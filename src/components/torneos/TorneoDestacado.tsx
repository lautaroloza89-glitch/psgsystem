import Link from "next/link";
import type { Torneo } from "@/types";
import { EstadoTorneoBadge } from "./EstadoTorneoBadge";
import { diasHastaTorneo, estadoTorneo, formatRangoFechasTorneo } from "@/lib/torneos/fechas";
import { ICONO_TIPO_TORNEO } from "@/lib/torneos/tipo";

function textoFaltante(dias: number): string {
  if (dias === 0) return "Es hoy";
  if (dias === 1) return "Es mañana";
  return `En ${dias} días`;
}

export function TorneoDestacado({
  torneo,
  hoy,
}: {
  torneo: Pick<Torneo, "id" | "nombre" | "tipo" | "lugar" | "fecha_inicio" | "fecha_fin">;
  hoy: string;
}) {
  const estado = estadoTorneo(torneo.fecha_inicio, torneo.fecha_fin, hoy);
  const dias = diasHastaTorneo(torneo.fecha_inicio, hoy);

  return (
    <Link
      href={`/torneos/${torneo.id}`}
      className="block rounded-xl border border-primary-200 bg-primary-50 p-6 shadow-xs transition duration-[var(--duration-base)] ease-standard hover:border-primary-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:p-8"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">
          Próximo en el calendario
        </p>
        <EstadoTorneoBadge estado={estado} />
      </div>
      <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
        <span aria-hidden="true" className="mr-2">
          {ICONO_TIPO_TORNEO[torneo.tipo]}
        </span>
        {torneo.nombre}
      </h2>
      <p className="mt-2 text-base text-text-muted">
        {formatRangoFechasTorneo(torneo.fecha_inicio, torneo.fecha_fin)}
        {torneo.lugar ? ` · ${torneo.lugar}` : ""}
      </p>
      {estado === "Próximo" && (
        <p className="mt-3 text-lg font-semibold text-primary-700">{textoFaltante(dias)}</p>
      )}
    </Link>
  );
}
