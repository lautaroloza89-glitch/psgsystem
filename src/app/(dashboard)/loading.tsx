export default function DashboardLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Cargando">
      <div className="h-8 w-48 animate-pulse rounded-md bg-surface-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg border border-border bg-surface-muted"
          />
        ))}
      </div>
    </div>
  );
}
