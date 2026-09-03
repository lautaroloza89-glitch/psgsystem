import { diaIsoDeFecha, fechasDelMesPorDia } from "@/lib/utils/date";

/** Día ISO del sábado (misma convención que `grupo_horarios.dias`). */
export const DIA_SABADO = 6;

/**
 * Días ISO en los que el grupo tiene clase según `grupo_horarios`, sin sábado.
 *
 * El filtro de sábado es exclusivo de Asistencia: Jungla sí tiene un bloque de
 * sábado en `grupo_horarios` (y sus planificaciones de sábado siguen
 * existiendo, F2 MOD 1), pero de ese bloque no se toma asistencia. Por eso el
 * filtro vive acá y no en `lib/utils/date.ts`.
 */
export function diasDeClaseSinSabado(horarios: { dias: number[] }[]): number[] {
  const dias = new Set<number>();
  for (const horario of horarios) {
    for (const dia of horario.dias) {
      if (dia !== DIA_SABADO) dias.add(dia);
    }
  }
  return [...dias].sort((a, b) => a - b);
}

/**
 * Fechas `YYYY-MM-DD` del mes en las que el grupo tiene clase, ordenadas de
 * la más vieja a la más nueva y sin sábados.
 */
export function fechasDeClaseDelMes(
  horarios: { dias: number[] }[],
  anio: number,
  mes: number
): string[] {
  return diasDeClaseSinSabado(horarios)
    .flatMap((dia) => fechasDelMesPorDia(anio, mes, dia))
    .sort();
}

/** ¿`fecha` es un día de clase del grupo del que se toma asistencia? */
export function esFechaDeClase(horarios: { dias: number[] }[], fecha: string): boolean {
  return diasDeClaseSinSabado(horarios).includes(diaIsoDeFecha(fecha));
}
