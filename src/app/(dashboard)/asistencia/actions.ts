"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { esFechaDeClase } from "@/lib/asistencia/fechas";
import { puedeGestionarAsistencia } from "@/lib/asistencia/permisos";

export interface FormState {
  error: string | null;
}

/**
 * Guardado de una fecha: escribe **solo lo marcado**.
 *
 * Hasta el rediseño del módulo 4 el guardado era en bloque — una fila por cada
 * alumna activa del grupo, `presente = false` para todas las que no estuvieran
 * tildadas. La alumna que quien cargaba se olvidaba de tocar quedaba ausente
 * sin que nadie lo hubiera dicho, y esa ausencia le contaba para la alerta de
 * 3 semanas. Ahora «sin marcar» es la ausencia de fila: la fecha queda en
 * estado Parcial hasta completarla, y el cálculo de la alerta saltea las
 * semanas en las que la alumna no tiene registro propio (ver `rachas.ts`).
 *
 * Desmarcar y volver a guardar borra la fila: es la única forma de deshacer
 * una marca puesta por error.
 *
 * Sin restricción de fecha: cualquier fecha pasada se puede volver a guardar
 * las veces que haga falta (a diferencia de Pagos, acá no hay paso de
 * verificación que proteger).
 */
export async function guardarAsistencia(
  grupoId: string,
  fecha: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await getCurrentUserProfile();
  if (!profile || !puedeGestionarAsistencia(profile.rol)) {
    return { error: "No tenés permiso para cargar asistencia." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { error: "Fecha inválida." };
  }

  const supabase = await createClient();

  const { data: grupo } = await supabase
    .from("grupos")
    .select("id, grupo_horarios(dias)")
    .eq("id", grupoId)
    .single();

  if (!grupo) {
    return { error: "No se encontró el grupo." };
  }
  // Segunda barrera del filtro de sábados (la primera es que la fecha nunca se
  // lista; la tercera es el check en base).
  if (!esFechaDeClase(grupo.grupo_horarios ?? [], fecha)) {
    return { error: "Esa fecha no es un día de clase de este grupo." };
  }

  const { data: alumnas } = await supabase
    .from("alumnas")
    .select("id")
    .eq("grupo_id", grupoId)
    .eq("estado", "activa");

  if (!alumnas || alumnas.length === 0) {
    return { error: "Este grupo no tiene alumnas activas." };
  }

  // Solo se aceptan ids de alumnas activas de este grupo: el formulario no es
  // la única forma de llegar a la action.
  const delGrupo = new Set(alumnas.map((a) => a.id));
  const vino = (formData.getAll("vino") as string[]).filter((id) => delGrupo.has(id));
  const falto = (formData.getAll("falto") as string[]).filter((id) => delGrupo.has(id));

  const marcadas = new Map<string, boolean>();
  for (const id of falto) marcadas.set(id, false);
  // «Vino» gana si por algún motivo llegara la misma alumna dos veces.
  for (const id of vino) marcadas.set(id, true);

  if (marcadas.size > 0) {
    const { error } = await supabase.from("asistencia").upsert(
      [...marcadas].map(([alumnaId, presente]) => ({
        alumna_id: alumnaId,
        // Snapshot: se guarda el grupo de esta pantalla, no se deriva después
        // de alumnas.grupo_id al leer.
        grupo_id: grupoId,
        fecha,
        presente,
        registrado_por: profile.id,
      })),
      { onConflict: "alumna_id,fecha" }
    );

    if (error) {
      return { error: "No se pudo guardar la asistencia." };
    }
  }

  // Lo que quedó sin marcar no debe conservar una fila vieja de esta fecha.
  const desmarcadas = alumnas.map((a) => a.id).filter((id) => !marcadas.has(id));
  if (desmarcadas.length > 0) {
    const { error } = await supabase
      .from("asistencia")
      .delete()
      .eq("grupo_id", grupoId)
      .eq("fecha", fecha)
      .in("alumna_id", desmarcadas);

    if (error) {
      return { error: "No se pudo guardar la asistencia." };
    }
  }

  revalidatePath("/asistencia");
  revalidatePath(`/asistencia/grupos/${grupoId}`);
  revalidatePath("/asistencia/alertas");
  redirect(`/asistencia?dia=${fecha}&guardada=${grupoId}`);
}
