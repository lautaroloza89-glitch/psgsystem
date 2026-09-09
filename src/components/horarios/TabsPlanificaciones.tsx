import Link from "next/link";

/**
 * Las dos entradas al módulo: por día y por grupo.
 *
 * Hasta acá la única puerta era grupo → mes, así que había que saber de
 * antemano qué grupo tocaba hoy. «Por día» no reemplaza a la vista por grupo
 * —donde se arma el mes—, la acompaña: es la que responde «qué hay hoy».
 */
export function TabsPlanificaciones({
  vista,
  hrefDia,
  hrefGrupo,
}: {
  vista: "dia" | "grupo";
  hrefDia: string;
  hrefGrupo: string;
}) {
  const base =
    "flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg";
  const activo = "bg-surface text-text shadow-xs";
  const inactivo = "text-text-muted hover:text-text";

  return (
    <nav aria-label="Cómo ver las planificaciones">
      <div className="flex gap-1 rounded-xl border border-border bg-surface-muted p-1">
        <Link
          href={hrefDia}
          aria-current={vista === "dia" ? "page" : undefined}
          className={`${base} ${vista === "dia" ? activo : inactivo}`}
        >
          Por día
        </Link>
        <Link
          href={hrefGrupo}
          aria-current={vista === "grupo" ? "page" : undefined}
          className={`${base} ${vista === "grupo" ? activo : inactivo}`}
        >
          Por grupo
        </Link>
      </div>
    </nav>
  );
}
