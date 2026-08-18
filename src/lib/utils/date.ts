export function formatFecha(fecha: string | null): string {
  if (!fecha) return "Sin fecha";
  const [year, month, day] = fecha.split("-");
  return `${day}/${month}/${year}`;
}
