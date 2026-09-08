import Link from "next/link";
import type { Vista } from "@/lib/tareas/agenda";

/**
 * Abiertas · Mías · Hechas — o Mías · Todas · Hechas para quien no dirige.
 *
 * Reemplaza a `FiltroEstadoTabs`, que filtraba por los cuatro estados y no
 * tenía forma de ver lo propio. El conteo va solo en la pestaña que no estás
 * mirando cuando aporta: saber cuántas hay abiertas es el dato de arranque.
 */
export function PestanasTareas({
  pestanas,
  actual,
  conteos,
}: {
  pestanas: { vista: Vista; label: string }[];
  actual: Vista;
  conteos: Partial<Record<Vista, number>>;
}) {
  return (
    <nav aria-label="Filtrar tareas">
      <ul className="flex gap-2 overflow-x-auto">
        {pestanas.map((pestana) => {
          const activa = pestana.vista === actual;
          const conteo = conteos[pestana.vista];
          return (
            <li key={pestana.vista}>
              <Link
                href={`/tareas?ver=${pestana.vista}`}
                aria-current={activa ? "page" : undefined}
                className={`inline-block whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                  activa
                    ? "bg-primary-500 text-on-primary"
                    : "bg-surface text-text-subtle hover:text-text"
                }`}
              >
                {pestana.label}
                {typeof conteo === "number" && conteo > 0 && (
                  <span className={activa ? "opacity-80" : ""}> · {conteo}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
