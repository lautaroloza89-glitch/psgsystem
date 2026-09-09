/**
 * El esqueleto del módulo, alineado con la entrada nueva: título con acción,
 * navegador de mes, el encabezado de recaudación y las líneas con número.
 * Sin este archivo se veía el del inicio, que no se parece a esta pantalla.
 */
export default function PagosLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-5" role="status" aria-label="Cargando">
      <div className="flex items-center justify-between gap-3">
        <div className="h-8 w-32 animate-pulse rounded bg-surface-muted" />
        <div className="h-9 w-28 animate-pulse rounded-md bg-surface-muted" />
      </div>

      <div className="h-13 animate-pulse rounded-xl border border-border bg-surface" />

      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="h-4 w-40 animate-pulse rounded bg-surface-muted" />
        <div className="mt-2 h-9 w-48 animate-pulse rounded bg-surface-muted" />
        <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-surface-muted" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-4 w-1/3 animate-pulse rounded bg-surface-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-surface-muted" />
            </div>
            <div className="h-4 w-20 flex-none animate-pulse rounded bg-surface-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
