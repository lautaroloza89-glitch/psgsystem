export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-xs transition-shadow duration-[var(--duration-base)] ease-standard">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-text-subtle">{label}</p>
    </div>
  );
}
