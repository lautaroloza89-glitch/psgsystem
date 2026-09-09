import Link from "next/link";
import { diaIsoDeFecha } from "@/lib/utils/date";

/**
 * La semana de un vistazo, de lunes a sábado. Reemplaza los dos pasos que
 * había antes de poder tildar a alguien (elegir grupo → elegir fecha): la
 * pantalla abre en hoy y moverse de día es un toque.
 *
 * En Asistencia el sábado aparece en gris y sin enlace: es día de horario para
 * Jungla, pero de ese bloque no se toma asistencia (decisión ya cerrada en
 * F2 MOD 4). Que esté a la vista, apagado, evita que se lea como un día que
 * falta. En Planificaciones el sábado **sí es un día normal** — Iniciación
 * entrena los sábados y su planificación existe —, de ahí `sabadoInactivo`.
 */

const LETRAS = ["L", "M", "X", "J", "V", "S"];

export function TiraDeDias({
  dias,
  seleccionado,
  hoy,
  basePath,
  sabadoInactivo,
}: {
  /** Los seis días de la semana, de lunes a sábado. */
  dias: string[];
  seleccionado: string;
  hoy: string;
  /** Pantalla que se recorre por fecha; el día viaja como `?dia=`. */
  basePath: string;
  sabadoInactivo: boolean;
}) {
  return (
    <nav aria-label="Días de la semana">
      <ul className="grid grid-cols-6 gap-1.5">
        {dias.map((dia, i) => {
          const activo = dia === seleccionado;
          const esHoy = dia === hoy;
          const esSabado = sabadoInactivo && diaIsoDeFecha(dia) === 6;
          const numero = Number(dia.slice(8, 10));

          const contenido = (
            <>
              <span className="block text-xs font-medium uppercase tracking-wide">{LETRAS[i]}</span>
              <span className="mt-0.5 block text-lg font-semibold tabular-nums">{numero}</span>
            </>
          );

          const base =
            "block rounded-lg border px-1 py-2 text-center transition-colors duration-[var(--duration-fast)] ease-standard";

          if (esSabado) {
            return (
              <li key={dia}>
                <span
                  className={`${base} border-border bg-surface-muted text-text-subtle opacity-60`}
                  title="Los sábados no se toma asistencia"
                >
                  {contenido}
                </span>
              </li>
            );
          }

          return (
            <li key={dia}>
              <Link
                href={`${basePath}?dia=${dia}`}
                aria-current={activo ? "date" : undefined}
                className={
                  activo
                    ? `${base} border-primary-500 bg-primary-500 text-on-primary`
                    : `${base} border-border bg-surface hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${esHoy ? "font-semibold text-primary-600" : ""}`
                }
              >
                {contenido}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
