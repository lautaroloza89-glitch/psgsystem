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
 *
 * **La Preparación física va adentro de esta tarjeta, no en una hermana.** El
 * grupo entrena una sola vez y las dos filas comparten horario, así que dos
 * tarjetas con el mismo nombre y el mismo horario se leían como dos grupos
 * distintos que coinciden de casualidad. Acercarlas no alcanzaba. El horario y
 * el objetivo del mes se dicen una sola vez, arriba: son de la clase, no del
 * bloque.
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
  const hrefCargarFisica = `${hrefCargar}&tipo=${encodeURIComponent("Preparación física")}`;

  const chip =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";
  const chipCargada = `${chip} border border-border bg-surface-muted text-text-muted hover:border-border-strong`;
  const chipFalta = `${chip} border border-warning-300 bg-warning-50 text-warning-800 hover:border-warning-500`;
  const chipMudo = `${chip} border border-dashed border-border text-text-subtle`;

  /** El chip de planificación, que es el mismo para el patín y para la física. */
  function ChipPlanificacion({
    cargada,
    href,
    hrefFalta,
  }: {
    cargada: boolean;
    href: string;
    hrefFalta: string;
  }) {
    if (cargada) {
      return (
        <Link href={href} className={chipCargada}>
          <Icono nombre="note" className="h-4 w-4" />
          Planificación
        </Link>
      );
    }
    if (puedeCargar) {
      return (
        <Link href={hrefFalta} className={chipFalta}>
          <Icono nombre="plus" className="h-4 w-4" />
          Sin planificación
        </Link>
      );
    }
    return <span className={chipMudo}>Sin planificación</span>;
  }

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
            {/* Solo cuando la física es lo único cargado de la franja y se
                muestra sola: ahí el nombre del grupo no alcanza para saber qué
                se está mirando. Con las dos filas, el diferenciador vive en el
                bloque de abajo. */}
            {clase.tipo === "Preparación física" && (
              <span className="font-normal text-text-muted"> · Preparación física</span>
            )}
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
      </p>

      <div className="flex flex-wrap items-start gap-2">
        {/* El objetivo del mes es del grupo y del mes, no del bloque: va una
            sola vez, acá arriba. */}
        <ChipObjetivoMes objetivo={clase.objetivoDelMes} />

        <ChipPlanificacion
          cargada={clase.tienePlanificacion}
          href={hrefClase}
          hrefFalta={hrefCargar}
        />
      </div>

      {/* El segundo contenido de la misma clase. Sin repetir horario —es la
          misma franja— pero con su propia profesora, que casi nunca es la del
          patín, y su propia planificación, que se abre por separado. */}
      {clase.fisica && (
        <div className="space-y-2 border-t border-border pt-3">
          <h4 className="text-sm font-semibold">
            <Link
              href={`/horarios/${clase.fisica.turnoId}`}
              className="hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Preparación física
              <span aria-hidden="true" className="ml-1.5 text-text-subtle">
                ›
              </span>
            </Link>
            {clase.fisica.estado === "Cancelado" && (
              <span className="ml-2 align-middle">
                <EstadoTurnoBadge estado="Cancelado" />
              </span>
            )}
          </h4>

          {clase.fisica.profesores.length > 0 && (
            <p className="text-sm text-text-subtle">{clase.fisica.profesores.join(", ")}</p>
          )}

          <div className="flex flex-wrap items-start gap-2">
            <ChipPlanificacion
              cargada={clase.fisica.tienePlanificacion}
              href={`/horarios/${clase.fisica.turnoId}`}
              hrefFalta={hrefCargarFisica}
            />
          </div>
        </div>
      )}

      {/* La segunda planificación de la misma franja, cuando todavía no existe.
          Vive al pie de la tarjeta y no como acción suelta de la pantalla
          porque pertenece a esta clase. Solo en grupos que ya cargaron física
          alguna vez —el flag se enciende solo con la primera— y solo mientras
          esa fecha no la tenga: con las dos cargadas desaparece. */}
      {puedeCargar && clase.grupoHaceFisica && !clase.yaTieneFisica && (
        <div className="border-t border-border pt-2">
          <Link
            href={hrefCargarFisica}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors duration-[var(--duration-fast)] ease-standard hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <Icono nombre="plus" className="h-4 w-4" />
            Agregar Preparación física
          </Link>
        </div>
      )}
    </li>
  );
}
