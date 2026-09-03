export function formatFecha(fecha: string | null): string {
  if (!fecha) return "Sin fecha";
  const [year, month, day] = fecha.split("-");
  return `${day}/${month}/${year}`;
}

const DIAS_NOMBRE: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

export function nombreDia(diaIso: number): string {
  return DIAS_NOMBRE[diaIso] ?? "?";
}

const MESES_NOMBRE = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/** `mes` en base 1 (1=enero ... 12=diciembre). */
export function nombreMes(mes: number): string {
  return MESES_NOMBRE[mes - 1] ?? "?";
}

/** Primer día del mes en formato `YYYY-MM-01`, mismo formato que `turnos.fecha`. */
export function primerDiaDeMes(anio: number, mes: number): string {
  return `${anio}-${String(mes).padStart(2, "0")}-01`;
}

/** Día ISO (1=lunes ... 7=domingo) de una fecha `YYYY-MM-DD`, sin desfasar por huso horario. */
export function diaIsoDeFecha(fecha: string): number {
  const [year, month, day] = fecha.split("-").map(Number);
  // Date.UTC evita que el huso horario local corra la fecha un día.
  const diaJs = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return diaJs === 0 ? 7 : diaJs;
}

/**
 * Todas las fechas `YYYY-MM-DD` de un mes que caen en un día ISO dado
 * (1=lunes ... 7=domingo). Usado en la carga de planificaciones (F2 MOD 1):
 * "los 4 lunes de septiembre".
 */
export function fechasDelMesPorDia(anio: number, mes: number, diaIso: number): string[] {
  const fechas: string[] = [];
  const ultimoDiaMes = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  for (let dia = 1; dia <= ultimoDiaMes; dia++) {
    const fecha = `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    if (diaIsoDeFecha(fecha) === diaIso) {
      fechas.push(fecha);
    }
  }
  return fechas;
}

/** Mes anterior y siguiente a (anio, mes), cruzando el límite de año. */
export function mesAnteriorSiguiente(anio: number, mes: number) {
  const anterior = mes === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: mes - 1 };
  const siguiente = mes === 12 ? { anio: anio + 1, mes: 1 } : { anio, mes: mes + 1 };
  return { anterior, siguiente };
}

/** Formato `YYYY-MM` para el query param `?mes=`. */
export function mesQuery(anio: number, mes: number): string {
  return `${anio}-${String(mes).padStart(2, "0")}`;
}

export function formatFechaHora(fechaIso: string): string {
  return new Date(fechaIso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
