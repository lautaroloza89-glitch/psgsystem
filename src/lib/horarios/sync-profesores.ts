import { createClient } from "@/lib/supabase/server";

/**
 * Sincroniza los profesores asignados a un turno contra una lista final,
 * por diff (altas/bajas) en vez de borrar todo y reinsertar todo — así el
 * trigger de notificación de asignación solo ve un INSERT real para los
 * profesores nuevos y no reenvía notificación a quien ya estaba asignado.
 * Compartido entre `editarTurno` y la carga de planificaciones (Parche
 * "unificar creación de planificaciones").
 */
export async function sincronizarProfesores(
  supabase: Awaited<ReturnType<typeof createClient>>,
  turnoId: string,
  profesoresFinal: string[]
): Promise<{ error: string | null }> {
  const { data: actuales, error: actualesError } = await supabase
    .from("turno_profesores")
    .select("profesor_id")
    .eq("turno_id", turnoId);

  if (actualesError) {
    return { error: "No se pudieron actualizar los profesores." };
  }

  const idsActuales = new Set((actuales ?? []).map((a) => a.profesor_id));
  const idsNuevos = new Set(profesoresFinal);
  const aQuitar = [...idsActuales].filter((id) => !idsNuevos.has(id));
  const aAgregar = [...idsNuevos].filter((id) => !idsActuales.has(id));

  if (aQuitar.length > 0) {
    const { error } = await supabase
      .from("turno_profesores")
      .delete()
      .eq("turno_id", turnoId)
      .in("profesor_id", aQuitar);
    if (error) return { error: "No se pudieron actualizar los profesores." };
  }

  if (aAgregar.length > 0) {
    const { error } = await supabase
      .from("turno_profesores")
      .insert(aAgregar.map((profesor_id) => ({ turno_id: turnoId, profesor_id })));
    if (error) return { error: "No se pudieron actualizar los profesores." };
  }

  return { error: null };
}
