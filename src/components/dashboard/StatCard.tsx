export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-black/10 p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-sm text-black/50">{label}</p>
    </div>
  );
}
