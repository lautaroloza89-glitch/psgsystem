import type { createClient } from "@/lib/supabase/server";
import { leerAsistenciaDelRango, type FilaAsistencia } from "@/lib/asistencia/consultas";
import { hoyArgentina, lunesDeLaSemana, sumarDias } from "@/lib/utils/date";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Semanas consecutivas sin ningún presente que disparan la alerta. */
export const SEMANAS_PARA_ALERTA = 3;

/**
 * Cuánto historial se mira hacia atrás. Alcanza de sobra para las 3 semanas de
 * la racha; el resto sirve para poder decir desde cuándo no viene la alumna.
 */
export const SEMANAS_VENTANA = 16;

export interface ContactoAlerta {
  nombre: string;
  telefono: string;
}

export interface AlertaInasistencia {
  alumnaId: string;
  apellido: string;
  nombre: string;
  grupoNombre: string;
  /** Pagador principal si hay uno cargado; si no, el primer contacto. */
  contacto: ContactoAlerta | null;
  /** Semanas seguidas (ya cerradas) con asistencia tomada y ningún presente. */
  semanasSinPresente: number;
  /** Última fecha con `presente = true` dentro de la ventana, si hay alguna. */
  ultimaPresencia: string | null;
}

/**
 * Alumnas activas con 3 semanas calendario consecutivas sin ningún presente.
 *
 * Se cuenta por SEMANA (lunes a domingo), no por clase: cada grupo tiene su
 * propia frecuencia (2 o 3 días), así que contar clases sueltas daría un
 * umbral distinto según el grupo.
 *
 * Reglas del cálculo:
 * - La semana en curso no se cuenta, para no disparar falsas alarmas a mitad
 *   de semana. Sí se mira aparte: si la alumna ya tuvo un presente esta
 *   semana, no entra en la alerta aunque venga de una racha (volvió).
 * - Una semana "cuenta" solo si tiene asistencia ya tomada. Una semana sin
 *   clase (feriado) o con la asistencia todavía sin cargar se saltea: no suma
 *   ni rompe la racha.
 * - "Semana con asistencia tomada" se evalúa sobre las filas de la propia
 *   alumna, no sobre las del grupo. Es equivalente en el caso normal (el
 *   guardado en bloque crea una fila por cada alumna activa del grupo) y
 *   además evita marcar como ausente a una alumna que todavía no estaba en el
 *   grupo esas semanas — su primer registro es su primera semana contada.
 */
export async function calcularAlertasInasistencia(
  supabase: SupabaseServerClient
): Promise<AlertaInasistencia[]> {
  const hoy = hoyArgentina();
  const lunesSemanaActual = lunesDeLaSemana(hoy);
  const ventanaInicio = sumarDias(lunesSemanaActual, -7 * SEMANAS_VENTANA);

  const [{ data: alumnas }, filas] = await Promise.all([
    supabase
      .from("alumnas")
      .select(
        "id, apellido, nombre, grupo:grupos(nombre), contactos(nombre, telefono, es_pagador_principal)"
      )
      .eq("estado", "activa")
      .order("apellido", { ascending: true })
      .order("nombre", { ascending: true }),
    leerAsistenciaDelRango(supabase, ventanaInicio, hoy),
  ]);

  const porAlumna = new Map<string, FilaAsistencia[]>();
  for (const fila of filas) {
    const lista = porAlumna.get(fila.alumna_id);
    if (lista) lista.push(fila);
    else porAlumna.set(fila.alumna_id, [fila]);
  }

  const alertas: AlertaInasistencia[] = [];

  for (const alumna of alumnas ?? []) {
    const suyas = porAlumna.get(alumna.id) ?? [];
    if (suyas.length === 0) continue;

    // Ya volvió esta semana → fuera de la alerta, sin mirar la racha.
    const presenteEstaSemana = suyas.some((f) => f.fecha >= lunesSemanaActual && f.presente);
    if (presenteEstaSemana) continue;

    const cerradas = suyas.filter((f) => f.fecha < lunesSemanaActual);

    // Semana (lunes) → ¿hubo al menos un presente? Solo entran las semanas que
    // tienen asistencia tomada, que son justamente las que tienen filas.
    const huboPresentePorSemana = new Map<string, boolean>();
    for (const fila of cerradas) {
      const semana = lunesDeLaSemana(fila.fecha);
      huboPresentePorSemana.set(semana, (huboPresentePorSemana.get(semana) ?? false) || fila.presente);
    }

    const semanasDesc = [...huboPresentePorSemana.keys()].sort().reverse();
    let semanasSinPresente = 0;
    for (const semana of semanasDesc) {
      if (huboPresentePorSemana.get(semana)) break;
      semanasSinPresente++;
    }

    if (semanasSinPresente < SEMANAS_PARA_ALERTA) continue;

    const presencias = suyas.filter((f) => f.presente).map((f) => f.fecha);
    const grupo = alumna.grupo as unknown as { nombre: string } | null;
    const contactos = (alumna.contactos ?? []) as unknown as {
      nombre: string;
      telefono: string;
      es_pagador_principal: boolean;
    }[];
    const contacto = contactos.find((c) => c.es_pagador_principal) ?? contactos[0] ?? null;

    alertas.push({
      alumnaId: alumna.id,
      apellido: alumna.apellido,
      nombre: alumna.nombre,
      grupoNombre: grupo?.nombre ?? "Sin grupo",
      contacto: contacto ? { nombre: contacto.nombre, telefono: contacto.telefono } : null,
      semanasSinPresente,
      ultimaPresencia: presencias.length > 0 ? presencias[presencias.length - 1] : null,
    });
  }

  // Primero la racha más larga; a igual racha, por apellido (ya vienen así).
  alertas.sort((a, b) => b.semanasSinPresente - a.semanasSinPresente);
  return alertas;
}
