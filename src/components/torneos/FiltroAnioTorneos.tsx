import Link from "next/link";

/** Mismo patrón de pills que `FiltroEstadoTurnoTabs` (Horarios). */
export function FiltroAnioTorneos({
  anios,
  anioActual,
}: {
  anios: number[];
  anioActual: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {anios.map((anio) => {
        const activo = anio === anioActual;
        return (
          <Link
            key={anio}
            href={`/torneos?anio=${anio}`}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
              activo
                ? "border-primary-500 bg-primary-500 text-on-primary hover:bg-primary-600"
                : "border-border text-text-muted hover:border-neutral-400 hover:bg-surface-muted"
            }`}
          >
            {anio}
          </Link>
        );
      })}
    </div>
  );
}
