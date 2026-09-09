import Link from "next/link";
import type { ClasePlanificada } from "@/lib/horarios/dia";
import { EstadoTurnoBadge } from "./EstadoTurnoBadge";
import { ChipObjetivoMes } from "./ChipObjetivoMes";
import { Icono } from "@/components/ui/Icono";

/**
 * Una clase del día: grupo, horario y quién la dicta, más los dos chips.
 *
 * Sin vista previa del texto. La que había cortaba los primeros 140 caracteres
 * de la planificación con el markdown arrancado a la fuerza, así que caía
 * siempre en la mitad de una frase y no había forma de elegir bien qué mostrar.
 * En su lugar, dos chips que dicen si hay algo cargado: el estado se lee de un
 * vistazo y el texto completo está a un toque.
 */
export function ClaseDelDiaCard({
  clase,
  fecha,
  puedeCargar,
}: {
  clase: ClasePlanificada;
  fecha: string;
  puedeCargar: boolean;
}) {
  const mes = fecha.slice(0, 7);
  const cancelada = clase.estado === "Cancelado";

  const hrefClase = clase.turnoId
    ? `/horarios/${clase.turnoId}`
    : `/horarios/grupos/${clase.grupoId}?mes=${mes}`;

  // El atajo de Pf: una sola clase, un solo toque. El formulario abre con el
  // grupo, el mes y esa fecha ya marcada, que es el caso real de «me falta la
  // de mañana».
  const hrefCargar = `/horarios/grupos/${clase.grupoId}/planificar?mes=${mes}&fecha=${fecha}`;

  const chip =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

  return (
    <li
      className={`space-y-2 rounded-xl border bg-surface p-4 shadow-xs ${
        cancelada ? "border-neutral-300" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold">
          <Link
            href={hrefClase}
            className="hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {clase.grupoNombre}
            <span aria-hidden="true" className="ml-1.5 text-text-subtle">
              ›
            </span>
          </Link>
        </h3>
        {cancelada && <EstadoTurnoBadge estado="Cancelado" />}
      </div>

      <p className="text-sm text-text-subtle">
        {clase.horaInicio.slice(0, 5)}–{clase.horaFin.slice(0, 5)}
        {clase.profesores.length > 0 ? ` · ${clase.profesores.join(", ")}` : ""}
        {clase.tipo === "Preparación física" ? " · Preparación física" : ""}
      </p>

      <div className="flex flex-wrap items-start gap-2">
        <ChipObjetivoMes objetivo={clase.objetivoDelMes} />

        {clase.tienePlanificacion ? (
          <Link
            href={hrefClase}
            className={`${chip} border border-border bg-surface-muted text-text-muted hover:border-border-strong`}
          >
            <Icono nombre="note" className="h-4 w-4" />
            Planificación
          </Link>
        ) : puedeCargar ? (
          <Link
            href={hrefCargar}
            className={`${chip} border border-warning-300 bg-warning-50 text-warning-800 hover:border-warning-500`}
          >
            <Icono nombre="plus" className="h-4 w-4" />
            Sin planificación
          </Link>
        ) : (
          <span className={`${chip} border border-dashed border-border text-text-subtle`}>
            Sin planificación
          </span>
        )}
      </div>
    </li>
  );
}
