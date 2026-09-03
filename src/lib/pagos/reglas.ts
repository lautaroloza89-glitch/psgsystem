// Reglas de negocio de F2 MOD 3, compartidas entre el formulario de alta
// (sugerencia de recargo), el reporte de Deudoras y el recibo.

// `hoyArgentina` vivía acá; se movió a lib/utils/date.ts al necesitarla
// también Asistencia (F2 MOD 4). Misma implementación, sin cambio de
// comportamiento.
import { hoyArgentina } from "@/lib/utils/date";

export const RECARGO_MONTO = 10000;
const DIA_LIMITE_SIN_RECARGO = 10;
const DIA_REFERENCIA_ATRASO = 15;

/** Primer día del mes actual (Argentina), formato `YYYY-MM-01`. */
export function mesActualISO(): string {
  return `${hoyArgentina().slice(0, 7)}-01`;
}

/** ¿Ya pasó el día 10 del `mesCorrespondiente` (`YYYY-MM-...`) según la fecha de hoy? */
export function haPasadoDiaLimite(mesCorrespondiente: string): boolean {
  const [anio, mes] = mesCorrespondiente.slice(0, 7).split("-");
  const limite = `${anio}-${mes}-${String(DIA_LIMITE_SIN_RECARGO).padStart(2, "0")}`;
  return hoyArgentina() > limite;
}

/** Días de atraso respecto del día 15 del `mesCorrespondiente` (0 si todavía no llegó). */
export function diasDeAtraso(mesCorrespondiente: string): number {
  const hoy = hoyArgentina();
  const [anio, mes] = mesCorrespondiente.slice(0, 7).split("-");
  const referencia = `${anio}-${mes}-${String(DIA_REFERENCIA_ATRASO).padStart(2, "0")}`;
  if (hoy <= referencia) return 0;
  const diffMs = new Date(`${hoy}T00:00:00Z`).getTime() - new Date(`${referencia}T00:00:00Z`).getTime();
  return Math.round(diffMs / 86_400_000);
}

/** ¿Hoy es día 8 o 9 del mes (Argentina)? — dispara el banner de recordatorio de Deudoras. */
export function esDiaDeRecordatorio(): boolean {
  const dia = Number(hoyArgentina().slice(8, 10));
  return dia === 8 || dia === 9;
}
