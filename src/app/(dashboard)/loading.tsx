/**
 * El esqueleto tiene que parecerse a lo que carga. El anterior mostraba seis
 * tarjetas grises en grilla y lo que aparecía después era un bloque de avisos
 * en lista, otro de clases y una línea de torneo: el salto se notaba en cada
 * navegación.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Cargando">
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="px-4 pt-4">
          <div className="h-5 w-40 animate-pulse rounded bg-surface-muted" />
        </div>
        <div className="mt-2 divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="h-9 w-9 flex-none animate-pulse rounded-lg bg-surface-muted" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-4 w-2/5 animate-pulse rounded bg-surface-muted" />
                <div className="h-3 w-3/5 animate-pulse rounded bg-surface-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-5 w-32 animate-pulse rounded bg-surface-muted" />
        <div className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3">
              <div className="w-14 flex-none space-y-1.5">
                <div className="h-4 w-11 animate-pulse rounded bg-surface-muted" />
                <div className="h-3 w-11 animate-pulse rounded bg-surface-muted" />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-4 w-1/3 animate-pulse rounded bg-surface-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-surface-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-16 animate-pulse rounded-xl border border-primary-200 bg-primary-50" />
    </div>
  );
}
