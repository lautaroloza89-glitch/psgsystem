import { lunesDeLaSemana } from "@/lib/utils/date";
import type { FilaAsistencia } from "@/lib/asistencia/consultas";

/** Semanas consecutivas sin ningún presente que disparan la alerta. */
export const SEMANAS_PARA_ALERTA = 3;

/**
 * A partir de cuántas semanas se avisa **dentro de la toma de asistencia**.
 * Es más bajo que el umbral de la alerta a propósito: la idea es que quien
 * carga vea venir la racha en la fila de la alumna y pregunte por ella antes
 * de que se convierta en alerta.
 */
export const SEMANAS_PARA_AVISO_EN_LISTA = 2;

export interface RachaAlumna {
  /** Semanas ya cerradas, seguidas, con registro propio y ningún presente. */
  semanasSinPresente: number;
  /** Ya vino esta semana: queda fuera de cualquier aviso aunque venga de racha. */
  presenteEstaSemana: boolean;
  /** Última fecha con `presente = true` dentro de las filas miradas. */
  ultimaPresencia: string | null;
}

/**
 * Racha de una alumna a partir de sus propias filas de `asistencia`.
 *
 * Se cuenta por SEMANA (lunes a domingo), no por clase: cada grupo tiene su
 * propia frecuencia (2 o 3 días), así que contar clases sueltas daría un
 * umbral distinto según el grupo.
 *
 * Reglas del cálculo:
 * - La semana en curso no se cuenta, para no disparar falsas alarmas a mitad
 *   de semana. Sí se mira aparte: si la alumna ya tuvo un presente esta
 *   semana, no entra en la alerta aunque venga de una racha (volvió).
 * - Una semana "cuenta" solo si la alumna tiene alguna fila propia en ella.
 *   Una semana sin clase (feriado), sin cargar, o cargada sin llegar a
 *   marcarla se saltea: no suma ni rompe la racha.
 * - Mirar las filas **propias** y no las del grupo es lo que hace que la carga
 *   parcial no invente ausencias: desde el rediseño del módulo 4, «sin marcar»
 *   deja de escribir fila, así que una alumna que nadie tocó esa semana está
 *   en la misma situación que una semana sin cargar. También evita contarle
 *   semanas a una alumna que todavía no estaba en el grupo: su primer registro
 *   es su primera semana contada.
 */
export function rachaDeAlumna(filas: FilaAsistencia[], lunesSemanaActual: string): RachaAlumna {
  const presenteEstaSemana = filas.some((f) => f.fecha >= lunesSemanaActual && f.presente);

  // Semana (lunes) → ¿hubo al menos un presente? Solo entran las semanas que
  // tienen registro propio, que son justamente las que tienen filas.
  const huboPresentePorSemana = new Map<string, boolean>();
  for (const fila of filas) {
    if (fila.fecha >= lunesSemanaActual) continue;
    const semana = lunesDeLaSemana(fila.fecha);
    huboPresentePorSemana.set(
      semana,
      (huboPresentePorSemana.get(semana) ?? false) || fila.presente
    );
  }

  let semanasSinPresente = 0;
  for (const semana of [...huboPresentePorSemana.keys()].sort().reverse()) {
    if (huboPresentePorSemana.get(semana)) break;
    semanasSinPresente++;
  }

  const presencias = filas.filter((f) => f.presente).map((f) => f.fecha);

  return {
    semanasSinPresente,
    presenteEstaSemana,
    ultimaPresencia: presencias.length > 0 ? presencias[presencias.length - 1] : null,
  };
}

/** Agrupa filas de `asistencia` por alumna, conservando el orden por fecha. */
export function agruparPorAlumna(filas: FilaAsistencia[]): Map<string, FilaAsistencia[]> {
  const porAlumna = new Map<string, FilaAsistencia[]>();
  for (const fila of filas) {
    const lista = porAlumna.get(fila.alumna_id);
    if (lista) lista.push(fila);
    else porAlumna.set(fila.alumna_id, [fila]);
  }
  return porAlumna;
}
