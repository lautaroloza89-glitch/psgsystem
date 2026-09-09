import Link from "next/link";
import { mesAnteriorSiguiente, mesQuery, nombreMes } from "@/lib/utils/date";

/**
 * El mes del módulo, en un solo lugar.
 *
 * Antes cada una de las cuatro pantallas de Pagos repetía sus propias flechas
 * de mes. Ahora el mes se elige en la entrada y viaja como `?mes=` a las
 * demás; este componente es el mismo control en todas, con flechas de 36px
 * (antes eran dos links de texto chico).
 */
export function NavegadorDeMes({
  basePath,
  anio,
  mes,
  /** Query params extra que hay que conservar al cambiar de mes. */
  extra,
}: {
  basePath: string;
  anio: number;
  mes: number;
  extra?: Record<string, string>;
}) {
  const { anterior, siguiente } = mesAnteriorSiguiente(anio, mes);

  const href = (a: number, m: number) => {
    const params = new URLSearchParams({ ...extra, mes: mesQuery(a, m) });
    return `${basePath}?${params.toString()}`;
  };

  const flecha =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-primary-600 transition-colors duration-[var(--duration-fast)] ease-standard hover:border-border-strong hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2">
      <Link
        href={href(anterior.anio, anterior.mes)}
        aria-label={`Mes anterior: ${nombreMes(anterior.mes)} ${anterior.anio}`}
        className={flecha}
      >
        <span aria-hidden="true">←</span>
      </Link>

      <span className="text-base font-semibold">
        {nombreMes(mes)} {anio}
      </span>

      <Link
        href={href(siguiente.anio, siguiente.mes)}
        aria-label={`Mes siguiente: ${nombreMes(siguiente.mes)} ${siguiente.anio}`}
        className={flecha}
      >
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
