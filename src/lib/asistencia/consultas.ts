import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Tamaño de página de la lectura de `asistencia` (el API corta en 1000 filas). */
const PAGINA = 1000;

export interface FilaAsistencia {
  alumna_id: string;
  grupo_id: string;
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
      .select("alumna_id, grupo_id, fecha, presente")
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

/**
 * Filas de un puñado de alumnas concretas en un rango. Es la lectura del aviso
 * de racha dentro de la toma de asistencia: acotarla a las alumnas del grupo
 * evita traerse el historial del club entero para mostrar trece líneas.
 *
 * Sin filtro de grupo a propósito: si la alumna cambió de grupo, su racha
 * incluye lo que asistió en el anterior.
 */
export async function leerAsistenciaDeAlumnas(
  supabase: SupabaseServerClient,
  alumnaIds: string[],
  desde: string,
  hasta: string
): Promise<FilaAsistencia[]> {
  if (alumnaIds.length === 0) return [];

  const { data, error } = await supabase
    .from("asistencia")
    .select("alumna_id, grupo_id, fecha, presente")
    .in("alumna_id", alumnaIds)
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("fecha", { ascending: true });

  if (error) throw new Error(`No se pudo leer la asistencia: ${error.message}`);
  return (data ?? []) as FilaAsistencia[];
}

export interface MarcaDelDia {
  alumna_id: string;
  grupo_id: string;
  presente: boolean;
  /** Quién la marcó — el dato ya se guardaba y no se mostraba en ningún lado. */
  registradoPor: string | null;
}

/**
 * Marcas de una fecha puntual, con el nombre de quien las cargó. Es la lectura
 * de la pantalla del día: alcanza con una consulta porque un día del club son
 * ~160 filas, muy lejos del corte de 1000.
 */
export async function leerMarcasDelDia(
  supabase: SupabaseServerClient,
  fecha: string,
  grupoId?: string
): Promise<MarcaDelDia[]> {
  let query = supabase
    .from("asistencia")
    .select("alumna_id, grupo_id, presente, autor:registrado_por(nombre)")
    .eq("fecha", fecha);

  if (grupoId) query = query.eq("grupo_id", grupoId);

  const { data, error } = await query;
  if (error) throw new Error(`No se pudo leer la asistencia del día: ${error.message}`);

  return (data ?? []).map((fila) => ({
    alumna_id: fila.alumna_id,
    grupo_id: fila.grupo_id,
    presente: fila.presente,
    registradoPor: (fila.autor as unknown as { nombre: string } | null)?.nombre ?? null,
  }));
}
