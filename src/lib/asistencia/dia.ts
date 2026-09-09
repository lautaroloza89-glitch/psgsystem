import type { createClient } from "@/lib/supabase/server";
import { bloqueDelDia, type BloqueHorario } from "@/lib/asistencia/fechas";
import { leerAsistenciaDelRango, leerMarcasDelDia } from "@/lib/asistencia/consultas";
import { diaIsoDeFecha, lunesDeLaSemana, sumarDias } from "@/lib/utils/date";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * El día de asistencia: qué grupos tienen clase en una fecha y cómo viene
 * cargada cada una.
 *
 * Los grupos del día salen de `grupo_horarios`, no de `turnos`: una clase
 * existe porque el grupo tiene ese día en su horario, exista o no la
 * planificación de esa fecha. Es la misma fuente que ya usaban el listado por
 * mes y la validación del guardado, así que las tres pantallas no pueden
 * discrepar sobre qué días son de clase.
 */

/**
 * Cuánto se mira hacia atrás buscando fechas a medio cargar. Una semana: es
 * el plazo en el que una carga olvidada todavía se recupera de memoria, y es
 * la ventana que ya usaba el aviso del inicio, así que las dos pantallas
 * cuentan lo mismo. Lo más viejo se sigue viendo en el listado por grupo.
 */
export const DIAS_DE_ATRASO = 7;

export type EstadoCarga = "pendiente" | "parcial" | "cargada" | "sin-alumnas";

export interface ClaseDelDia {
  grupoId: string;
  grupoNombre: string;
  horaInicio: string;
  horaFin: string;
  /** Alumnas activas del grupo: el total contra el que se mide la carga. */
  totalAlumnas: number;
  /** Alumnas con marca (vino o faltó) en esa fecha. */
  marcadas: number;
  presentes: number;
  estado: EstadoCarga;
  /** Nombre de pila de quien cargó, si hay alguna marca. */
  cargadaPor: string | null;
}

export interface FechaAtrasada {
  grupoId: string;
  grupoNombre: string;
  fecha: string;
  /** `true` si no tiene ninguna marca; `false` si quedó a medio cargar. */
  vacia: boolean;
}

interface GrupoConHorarios {
  id: string;
  nombre: string;
  grupo_horarios: BloqueHorario[] | null;
}

async function leerGruposConHorarios(supabase: Supabase): Promise<GrupoConHorarios[]> {
  const { data } = await supabase
    .from("grupos")
    .select("id, nombre, grupo_horarios(dias, hora_inicio, hora_fin)")
    .order("nombre");

  return (data ?? []) as unknown as GrupoConHorarios[];
}

/** Alumnas activas por grupo. El total de hoy, que es contra el que se carga. */
async function contarAlumnasActivas(supabase: Supabase): Promise<Map<string, number>> {
  const { data } = await supabase.from("alumnas").select("grupo_id").eq("estado", "activa");

  const porGrupo = new Map<string, number>();
  for (const alumna of data ?? []) {
    if (alumna.grupo_id) porGrupo.set(alumna.grupo_id, (porGrupo.get(alumna.grupo_id) ?? 0) + 1);
  }
  return porGrupo;
}

function estadoDeCarga(marcadas: number, totalAlumnas: number): EstadoCarga {
  if (totalAlumnas === 0) return "sin-alumnas";
  if (marcadas === 0) return "pendiente";
  return marcadas >= totalAlumnas ? "cargada" : "parcial";
}

/** Las clases de una fecha, ordenadas por hora de inicio. Vacío los sábados. */
export async function clasesDelDia(supabase: Supabase, fecha: string): Promise<ClaseDelDia[]> {
  const diaIso = diaIsoDeFecha(fecha);

  const [grupos, alumnasPorGrupo, marcas] = await Promise.all([
    leerGruposConHorarios(supabase),
    contarAlumnasActivas(supabase),
    leerMarcasDelDia(supabase, fecha),
  ]);

  const porGrupo = new Map<string, { marcadas: number; presentes: number; autor: string | null }>();
  for (const marca of marcas) {
    const actual = porGrupo.get(marca.grupo_id) ?? { marcadas: 0, presentes: 0, autor: null };
    actual.marcadas++;
    if (marca.presente) actual.presentes++;
    actual.autor ??= marca.registradoPor;
    porGrupo.set(marca.grupo_id, actual);
  }

  const clases: ClaseDelDia[] = [];

  for (const grupo of grupos) {
    const bloque = bloqueDelDia(grupo.grupo_horarios ?? [], diaIso);
    if (!bloque) continue;

    const conteo = porGrupo.get(grupo.id);
    const totalAlumnas = alumnasPorGrupo.get(grupo.id) ?? 0;
    const marcadas = conteo?.marcadas ?? 0;

    clases.push({
      grupoId: grupo.id,
      grupoNombre: grupo.nombre,
      horaInicio: bloque.hora_inicio,
      horaFin: bloque.hora_fin,
      totalAlumnas,
      marcadas,
      presentes: conteo?.presentes ?? 0,
      estado: estadoDeCarga(marcadas, totalAlumnas),
      cargadaPor: conteo?.autor ? conteo.autor.split(" ")[0] : null,
    });
  }

  return clases.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
}

/**
 * Fechas de clase ya pasadas que quedaron sin cargar o a medio cargar, de
 * todos los grupos juntos. Es lo que hoy hay que ir a buscar grupo por grupo.
 *
 * La ventana es la última semana (ver `DIAS_DE_ATRASO`).
 */
export async function fechasAtrasadas(
  supabase: Supabase,
  hoy: string,
  dias = DIAS_DE_ATRASO
): Promise<FechaAtrasada[]> {
  const desde = sumarDias(hoy, -dias);
  const hasta = sumarDias(hoy, -1);
  if (hasta < desde) return [];

  const [grupos, alumnasPorGrupo, filas] = await Promise.all([
    leerGruposConHorarios(supabase),
    contarAlumnasActivas(supabase),
    leerAsistenciaDelRango(supabase, desde, hasta),
  ]);

  const marcadasPorClase = new Map<string, number>();
  for (const fila of filas) {
    const clave = `${fila.grupo_id}|${fila.fecha}`;
    marcadasPorClase.set(clave, (marcadasPorClase.get(clave) ?? 0) + 1);
  }

  const atrasadas: FechaAtrasada[] = [];

  for (let fecha = desde; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
    const diaIso = diaIsoDeFecha(fecha);

    for (const grupo of grupos) {
      if (!bloqueDelDia(grupo.grupo_horarios ?? [], diaIso)) continue;

      const total = alumnasPorGrupo.get(grupo.id) ?? 0;
      if (total === 0) continue;

      const marcadas = marcadasPorClase.get(`${grupo.id}|${fecha}`) ?? 0;
      if (marcadas >= total) continue;

      atrasadas.push({
        grupoId: grupo.id,
        grupoNombre: grupo.nombre,
        fecha,
        vacia: marcadas === 0,
      });
    }
  }

  return atrasadas;
}

/**
 * Los seis días de la semana de `fecha`, de lunes a sábado. El domingo no se
 * lista (no hay clases) y el sábado sí, en gris: es un día que existe en el
 * horario de Jungla pero del que no se toma asistencia, y no mostrarlo haría
 * pensar que falta algo.
 */
export function diasDeLaSemana(fecha: string): string[] {
  const lunes = lunesDeLaSemana(fecha);
  return [0, 1, 2, 3, 4, 5].map((offset) => sumarDias(lunes, offset));
}
