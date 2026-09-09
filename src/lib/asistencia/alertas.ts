import type { createClient } from "@/lib/supabase/server";
import { leerAsistenciaDelRango } from "@/lib/asistencia/consultas";
import { SEMANAS_PARA_ALERTA, agruparPorAlumna, rachaDeAlumna } from "@/lib/asistencia/rachas";
import { hoyArgentina, lunesDeLaSemana, sumarDias } from "@/lib/utils/date";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export { SEMANAS_PARA_ALERTA };

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
  /** Semanas seguidas (ya cerradas) con registro propio y ningún presente. */
  semanasSinPresente: number;
  /** Última fecha con `presente = true` dentro de la ventana, si hay alguna. */
  ultimaPresencia: string | null;
}

/**
 * Alumnas activas con 3 semanas calendario consecutivas sin ningún presente.
 *
 * El cálculo por alumna vive en `rachas.ts` — lo comparte con el aviso que la
 * toma de asistencia muestra en la fila de cada alumna, para que las dos
 * pantallas no puedan discrepar sobre cuántas semanas lleva alguien sin venir.
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

  const porAlumna = agruparPorAlumna(filas);
  const alertas: AlertaInasistencia[] = [];

  for (const alumna of alumnas ?? []) {
    const suyas = porAlumna.get(alumna.id) ?? [];
    if (suyas.length === 0) continue;

    const racha = rachaDeAlumna(suyas, lunesSemanaActual);
    if (racha.presenteEstaSemana) continue;
    if (racha.semanasSinPresente < SEMANAS_PARA_ALERTA) continue;

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
      semanasSinPresente: racha.semanasSinPresente,
      ultimaPresencia: racha.ultimaPresencia,
    });
  }

  // Primero la racha más larga; a igual racha, por apellido (ya vienen así).
  alertas.sort((a, b) => b.semanasSinPresente - a.semanasSinPresente);
  return alertas;
}
