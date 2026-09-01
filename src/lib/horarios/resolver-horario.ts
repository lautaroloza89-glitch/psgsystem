import { createClient } from "@/lib/supabase/server";

/**
 * Busca, dentro de los bloques horarios de un grupo, el que cubre un día
 * ISO puntual (1=lunes ... 7=domingo). El horario de una clase ya no se
 * elige a mano: se deriva del grupo + el día de semana de la fecha (Parche
 * "unificar creación de planificaciones" — antes, para grupos con más de
 * un bloque como Jungla, había que elegir el bloque a mano; ya no hace
 * falta porque el día de la semana lo determina solo). Si el mismo día
 * aparece en más de un bloque (no debería pasar hoy) se queda con el
 * primero.
 */
export async function resolverHorarioPorDia(
  supabase: Awaited<ReturnType<typeof createClient>>,
  grupo_id: string,
  diaIso: number
): Promise<{ hora_inicio: string; hora_fin: string } | null> {
  const { data: bloques } = await supabase
    .from("grupo_horarios")
    .select("dias, hora_inicio, hora_fin")
    .eq("grupo_id", grupo_id);

  const bloque = (bloques ?? []).find((b) => (b.dias as number[]).includes(diaIso));
  if (!bloque) return null;

  return { hora_inicio: bloque.hora_inicio, hora_fin: bloque.hora_fin };
}
