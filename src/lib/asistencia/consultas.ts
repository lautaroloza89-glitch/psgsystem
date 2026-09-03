import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Tamaño de página de la lectura de `asistencia` (el API corta en 1000 filas). */
const PAGINA = 1000;

export interface FilaAsistencia {
  alumna_id: string;
  fecha: string;
  presente: boolean;
}

/**
 * Filas de `asistencia` en un rango de fechas (inclusive en los dos extremos),
 * ordenadas por fecha ascendente. Pagina sola: una asistencia diaria de todo
 * el club pasa las 1000 filas que devuelve el API por defecto.
 */
export async function leerAsistenciaDelRango(
  supabase: SupabaseServerClient,
  desde: string,
  hasta: string,
  grupoId?: string
): Promise<FilaAsistencia[]> {
  const filas: FilaAsistencia[] = [];

  for (let pagina = 0; ; pagina++) {
    let query = supabase
      .from("asistencia")
      .select("alumna_id, fecha, presente")
      .gte("fecha", desde)
      .lte("fecha", hasta);

    if (grupoId) {
      query = query.eq("grupo_id", grupoId);
    }

    const { data, error } = await query
      .order("fecha", { ascending: true })
      .range(pagina * PAGINA, pagina * PAGINA + PAGINA - 1);

    // Sin fallback silencioso: una lectura a medias haría que la alerta de
    // inasistencias muestre menos alumnas de las que corresponde.
    if (error) throw new Error(`No se pudo leer la asistencia: ${error.message}`);
    if (!data) break;

    filas.push(...(data as FilaAsistencia[]));
    if (data.length < PAGINA) break;
  }

  return filas;
}
