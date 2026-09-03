import Link from "next/link";
import type { Torneo } from "@/types";
import { EstadoTorneoBadge } from "./EstadoTorneoBadge";
import { estadoTorneo, formatRangoFechasTorneo } from "@/lib/torneos/fechas";
import { ICONO_TIPO_TORNEO } from "@/lib/torneos/tipo";

export function TorneoCard({
  torneo,
  hoy,
  headingLevel = "h2",
}: {
  torneo: Pick<Torneo, "id" | "nombre" | "tipo" | "lugar" | "fecha_inicio" | "fecha_fin">;
  hoy: string;
  /** "h3" cuando la tarjeta va anidada bajo una sección ya encabezada por un h2. */
  headingLevel?: "h2" | "h3";
}) {
  const Titulo = headingLevel;
  const estado = estadoTorneo(torneo.fecha_inicio, torneo.fecha_fin, hoy);
  const pasado = estado === "Pasado";

  return (
    <Link
      href={`/torneos/${torneo.id}`}
      className={`block rounded-lg border border-border bg-surface p-5 shadow-xs transition duration-[var(--duration-base)] ease-standard hover:border-border-strong hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
        pasado ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <Titulo className="text-lg font-semibold">
          <span aria-hidden="true" className="mr-1.5">
            {ICONO_TIPO_TORNEO[torneo.tipo]}
          </span>
          {torneo.nombre}
        </Titulo>
        <EstadoTorneoBadge estado={estado} />
      </div>
      <p className="mt-2 text-sm text-text-subtle">
        {formatRangoFechasTorneo(torneo.fecha_inicio, torneo.fecha_fin)}
        {torneo.lugar ? ` · ${torneo.lugar}` : ""}
      </p>
    </Link>
  );
}
