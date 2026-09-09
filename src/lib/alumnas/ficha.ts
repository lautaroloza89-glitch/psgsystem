import type { createClient } from "@/lib/supabase/server";
import { leerAsistenciaDeAlumnas, leerAsistenciaDelRango } from "@/lib/asistencia/consultas";
import {
  agruparPorAlumna,
  rachaDeAlumna,
  SEMANAS_PARA_AVISO_EN_LISTA,
} from "@/lib/asistencia/rachas";
import { SEMANAS_VENTANA } from "@/lib/asistencia/alertas";
import { calcularSaldoAlumnaMes, type SaldoAlumnaMes } from "@/lib/pagos/saldo";
import { hoyArgentina, lunesDeLaSemana, sumarDias } from "@/lib/utils/date";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Lo que la ficha de una alumna no contaba.
 *
 * Tenía apellido, DNI, fecha de inscripción y contactos: nada sobre si vino
 * este mes o si la cuota está paga, **aunque el sistema tiene los dos datos**.
 * Son las dos preguntas que se hacen justo antes de llamar a la casa, que es
 * para lo que se abre esta pantalla.
 */

export interface AsistenciaDelMes {
  /** Veces que vino, de las clases en que la marcaron. */
  presentes: number;
  /**
   * Clases en las que se la marcó (vino o faltó). Con el guardado parcial del
   * módulo 4, una clase en la que nadie la tocó no cuenta: no se sabe si vino.
   */
  marcadas: number;
}

export interface DatosFichaAlumna {
  asistencia: AsistenciaDelMes;
  /** Semanas seguidas sin venir, solo si ya son suficientes para avisar. */
  semanasSinVenir: number | null;
  /** Última fecha con presente dentro de la ventana de la alerta. */
  ultimaPresencia: string | null;
  /** `null` si la alumna no tiene grupo: sin grupo no hay cuota. */
  saldo: SaldoAlumnaMes | null;
}

export async function datosDeFichaAlumna(
  supabase: Supabase,
  alumnaId: string,
  /** Mes a mirar, `YYYY-MM-01`. */
  mesISO: string
): Promise<DatosFichaAlumna> {
  const hoy = hoyArgentina();
  const lunesSemanaActual = lunesDeLaSemana(hoy);

  // Una sola lectura para las dos cosas: la ventana de la racha (16 semanas)
  // cubre de sobra el mes que se muestra.
  const desdeRacha = sumarDias(lunesSemanaActual, -7 * SEMANAS_VENTANA);
  const desde = desdeRacha < mesISO ? desdeRacha : mesISO;

  const [filas, saldo] = await Promise.all([
    leerAsistenciaDeAlumnas(supabase, [alumnaId], desde, hoy),
    calcularSaldoAlumnaMes(supabase, alumnaId, mesISO),
  ]);

  const finDeMes = ultimoDiaDelMes(mesISO);
  const delMes = filas.filter((f) => f.fecha >= mesISO && f.fecha <= finDeMes);

  const racha = rachaDeAlumna(filas, lunesSemanaActual);
  const avisar =
    !racha.presenteEstaSemana && racha.semanasSinPresente >= SEMANAS_PARA_AVISO_EN_LISTA;

  return {
    asistencia: {
      presentes: delMes.filter((f) => f.presente).length,
      marcadas: delMes.length,
    },
    semanasSinVenir: avisar ? racha.semanasSinPresente : null,
    ultimaPresencia: racha.ultimaPresencia,
    saldo,
  };
}

/**
 * Semanas sin venir de **todas** las alumnas, para marcar la excepción en el
 * listado. Devuelve solo las que llegan al umbral de aviso: el resto no tiene
 * nada que mostrar.
 *
 * Una sola lectura del rango para todo el club, igual que la alerta — no una
 * consulta por alumna.
 */
export async function rachasParaListado(supabase: Supabase): Promise<Map<string, number>> {
  const hoy = hoyArgentina();
  const lunesSemanaActual = lunesDeLaSemana(hoy);
  const desde = sumarDias(lunesSemanaActual, -7 * SEMANAS_VENTANA);

  const filas = await leerAsistenciaDelRango(supabase, desde, hoy);
  const porAlumna = agruparPorAlumna(filas);

  const rachas = new Map<string, number>();
  for (const [alumnaId, suyas] of porAlumna) {
    const racha = rachaDeAlumna(suyas, lunesSemanaActual);
    if (racha.presenteEstaSemana) continue;
    if (racha.semanasSinPresente < SEMANAS_PARA_AVISO_EN_LISTA) continue;
    rachas.set(alumnaId, racha.semanasSinPresente);
  }

  return rachas;
}

/** Último día del mes de `mesISO` (`YYYY-MM-01`), en `YYYY-MM-DD`. */
function ultimoDiaDelMes(mesISO: string): string {
  const [anio, mes] = mesISO.split("-").map(Number);
  const dia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/** «11 años» a partir de la fecha de nacimiento, o `null` si no está cargada. */
export function edadDe(fechaNacimiento: string | null, hoy = hoyArgentina()): number | null {
  if (!fechaNacimiento) return null;

  const [anioN, mesN, diaN] = fechaNacimiento.split("-").map(Number);
  const [anioH, mesH, diaH] = hoy.split("-").map(Number);

  let edad = anioH - anioN;
  if (mesH < mesN || (mesH === mesN && diaH < diaN)) edad--;

  return edad >= 0 && edad < 120 ? edad : null;
}
