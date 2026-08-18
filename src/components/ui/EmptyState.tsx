export function EmptyState({ mensaje }: { mensaje: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border-strong bg-surface-muted px-6 py-10 text-center">
      <p className="text-sm text-text-subtle">{mensaje}</p>
    </div>
  );
}
