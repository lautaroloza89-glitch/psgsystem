/**
 * El esqueleto del módulo, alineado con el listado nuevo: título con acción,
 * buscador, chips de grupo y filas de una línea — no la grilla de tarjetas que
 * había antes, ni el bloque de avisos del inicio.
 */
export default function AlumnasLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4" role="status" aria-label="Cargando">
      <div className="flex items-center justify-between gap-3">
        <div className="h-8 w-32 animate-pulse rounded bg-surface-muted" />
        <div className="h-9 w-20 animate-pulse rounded-md bg-surface-muted" />
      </div>

      <div className="h-11 animate-pulse rounded-lg bg-surface-muted" />

      <div className="flex gap-2">
        {[16, 24, 20, 18].map((ancho, i) => (
          <div
            key={i}
            className="h-9 animate-pulse rounded-full bg-surface-muted"
            style={{ width: `${ancho * 4}px` }}
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
            <div className="h-9 w-9 flex-none animate-pulse rounded-full bg-surface-muted" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-4 w-2/5 animate-pulse rounded bg-surface-muted" />
              <div className="h-3 w-1/4 animate-pulse rounded bg-surface-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
