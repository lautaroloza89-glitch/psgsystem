"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { esFechaDeClase } from "@/lib/asistencia/fechas";
import { puedeGestionarAsistencia } from "@/lib/asistencia/permisos";
import { mesQuery } from "@/lib/utils/date";

export interface FormState {
  error: string | null;
}

/**
 * Guardado en bloque de una fecha: crea (o pisa) una fila por CADA alumna
 * activa del grupo — `presente = true` para las tildadas, `presente = false`
 * para el resto. Nunca quedan alumnas sin registro en una fecha ya guardada,
 * que es lo que le da datos completos a la alerta de inasistencias.
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

  const presentes = new Set(formData.getAll("presente") as string[]);

  const { error } = await supabase.from("asistencia").upsert(
    alumnas.map((a) => ({
      alumna_id: a.id,
      // Snapshot: se guarda el grupo de esta pantalla, no se deriva después
      // de alumnas.grupo_id al leer.
      grupo_id: grupoId,
      fecha,
      presente: presentes.has(a.id),
      registrado_por: profile.id,
    })),
    { onConflict: "alumna_id,fecha" }
  );

  if (error) {
    return { error: "No se pudo guardar la asistencia." };
  }

  const [anio, mes] = fecha.split("-").map(Number);
  const mesParam = mesQuery(anio, mes);

  revalidatePath(`/asistencia/grupos/${grupoId}`);
  revalidatePath("/asistencia/alertas");
  redirect(`/asistencia/grupos/${grupoId}?mes=${mesParam}&guardada=${fecha}`);
}
