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

export interface BloqueHorario {
  dias: number[];
  hora_inicio: string;
  hora_fin: string;
}

/**
 * Bloque horario que cubre un día ISO, ya con el filtro de sábado aplicado.
 *
 * Es el equivalente de `resolverHorarioPorDia` (Planificaciones) para el
 * listado del día: acá los bloques ya vienen leídos junto con el grupo, así
 * que resolverlo en memoria evita una consulta por grupo. Si el mismo día
 * apareciera en más de un bloque se queda con el primero, igual que aquel.
 */
export function bloqueDelDia(
  horarios: BloqueHorario[],
  diaIso: number
): BloqueHorario | null {
  if (diaIso === DIA_SABADO) return null;
  return horarios.find((bloque) => bloque.dias.includes(diaIso)) ?? null;
}
