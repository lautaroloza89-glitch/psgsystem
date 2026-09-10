import Link from "next/link";
import { Icono } from "@/components/ui/Icono";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ClaseDeHoy } from "@/lib/dashboard/inicio";

/**
 * «Hoy en el club» / «Tus clases de hoy» — reemplaza «Próximas clases», que
 * traía los 5 turnos activos más próximos de **todo** el club para cualquier
 * rol, mezclando días.
 *
 * Lo que se agrega es el estado de cada clase (planificada, asistencia tomada,
 * sin planificar), que es lo que se mira a la mañana y hoy obliga a entrar a
 * cada una para saberlo.
 */

function hhmm(hora: string): string {
  return hora.slice(0, 5);
}

function Estado({ clase }: { clase: ClaseDeHoy }) {
  if (clase.asistenciaTomada) {
    return <span className="text-success-600">asistencia tomada</span>;
  }
  if (!clase.planificada) {
    return <span className="font-semibold text-warning-700">sin planificar</span>;
  }
  return <span>planificada</span>;
}

export function BloqueClasesHoy({
  titulo,
  verTodas,
  clases,
  /** Quien toma asistencia ve «Tomar asistencia» como acción del bloque: es lo que repite todos los días y hoy está a tres toques. */
  conAccionAsistencia = false,
}: {
  titulo: string;
  verTodas: { label: string; href: string };
  clases: ClaseDeHoy[];
  conAccionAsistencia?: boolean;
}) {
  // El botón es del bloque entero, no de una clase puntual: `/asistencia` es la
  // entrada general del módulo, donde se elige cualquiera de los grupos de hoy.
  // Colgado del `<li>` de la primera clase daba a entender que iba a esa clase.
  const faltaTomarAsistencia =
    conAccionAsistencia && clases.some((clase) => !clase.asistenciaTomada);

  return (
    <section aria-labelledby="clases-titulo" className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="clases-titulo" className="text-base font-semibold">
          {titulo}
        </h2>
        <Link
          href={verTodas.href}
          className="rounded text-sm text-text-subtle transition-colors duration-[var(--duration-fast)] ease-standard hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          {verTodas.label}
        </Link>
      </div>

      {clases.length === 0 ? (
        <EmptyState mensaje="Hoy no hay clases." />
      ) : (
        <ul className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
          {clases.map((clase) => (
            <li key={clase.id}>
              <Link
                href={`/horarios/${clase.id}`}
                className="flex items-start gap-3 px-4 py-3 transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
              >
                <span className="w-14 flex-none text-sm tabular-nums text-text-subtle">
                  <span className="block font-semibold text-text">{hhmm(clase.horaInicio)}</span>
                  <span className="block">{hhmm(clase.horaFin)}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-snug">{clase.grupoNombre}</span>
                  <span className="block text-sm text-text-subtle">
                    {clase.cantidadAlumnas !== null
                      ? `${clase.cantidadAlumnas} ${clase.cantidadAlumnas === 1 ? "alumna" : "alumnas"}`
                      : clase.profesores.length > 0
                        ? clase.profesores.join(", ")
                        : "Sin profesor asignado"}{" "}
                    · <Estado clase={clase} />
                  </span>
                </span>
              </Link>

              {/* La Preparación física de la misma franja: indentada bajo su
                  clase, sin repetir nombre ni horario —es la misma clase, el
                  grupo entrena una sola vez— pero con su propia profesora, que
                  casi nunca es la del patín. */}
              {clase.fisica && (
                <Link
                  href={`/horarios/${clase.fisica.id}`}
                  className="flex items-start gap-3 border-t border-border py-2 pl-[4.25rem] pr-4 transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
                >
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block font-medium leading-snug">Preparación física</span>
                    <span className="block text-text-subtle">
                      {clase.fisica.profesores.length > 0
                        ? clase.fisica.profesores.join(", ")
                        : "Sin profesor asignado"}{" "}
                      ·{" "}
                      {clase.fisica.planificada ? (
                        <span>planificada</span>
                      ) : (
                        <span className="font-semibold text-warning-700">sin planificar</span>
                      )}
                    </span>
                  </span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}

      {faltaTomarAsistencia && (
        <Link
          href="/asistencia"
          className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-3 py-2 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <Icono nombre="check-square" className="h-4 w-4" />
          Tomar asistencia
        </Link>
      )}
    </section>
  );
}
