export function formatFecha(fecha: string | null): string {
  if (!fecha) return "Sin fecha";
  const [year, month, day] = fecha.split("-");
  return `${day}/${month}/${year}`;
}

export function formatTiempoRelativo(fechaIso: string): string {
  const diffSeg = Math.max(0, Math.floor((Date.now() - new Date(fechaIso).getTime()) / 1000));

  if (diffSeg < 60) return "hace un momento";
  const diffMin = Math.floor(diffSeg / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `hace ${diffHoras} h`;
  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias < 7) return `hace ${diffDias} d`;
  const diffSemanas = Math.floor(diffDias / 7);
  return `hace ${diffSemanas} sem`;
}
