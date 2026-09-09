/**
 * El esqueleto del módulo, alineado con lo que carga: título, tira de días y
 * las clases del día. Sin este archivo se veía el del inicio (bloque de avisos
 * + lista de clases + torneo), que no se parece en nada a esta pantalla.
 */
export default function AsistenciaLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6" role="status" aria-label="Cargando">
      <div className="space-y-3">
        <div className="h-8 w-40 animate-pulse rounded bg-surface-muted" />
        <div className="grid grid-cols-6 gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-surface" />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-5 w-48 animate-pulse rounded bg-surface-muted" />
        <div className="h-32 animate-pulse rounded-xl border border-border bg-surface" />
        <div className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-4 w-1/3 animate-pulse rounded bg-surface-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-surface-muted" />
              </div>
              <div className="h-7 w-20 flex-none animate-pulse rounded-full bg-surface-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
