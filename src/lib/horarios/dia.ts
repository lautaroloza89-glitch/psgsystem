import type { createClient } from "@/lib/supabase/server";
import type { BloqueHorario } from "@/lib/asistencia/fechas";
import type { EstadoTurno, TipoTurno } from "@/types";
import {
  diaIsoDeFecha,
  fechasDelMesPorDia,
  nombreDia,
  primerDiaDeMes,
} from "@/lib/utils/date";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Las dos entradas del módulo Planificaciones: por día y por grupo.
 *
 * Los días de clase salen de `grupo_horarios` y no de `turnos`, igual que en
 * Asistencia: una clase existe porque el grupo tiene ese día en su horario,
 * exista o no la planificación de esa fecha. Es lo que permite mostrar «Sin
 * planificación», que antes no se podía ver desde ningún lado — el listado por
 * mes solo traía las fechas que ya tenían texto cargado.
 *
 * A diferencia de `lib/asistencia/dia.ts`, acá el sábado **sí cuenta**:
 * Iniciación entrena los sábados y su planificación existe. El filtro de
 * sábado es exclusivo de Asistencia (ver `diasDeClaseSinSabado`).
 */

/** Una clase de una fecha puntual, con lo que hace falta para la tarjeta del día. */
export interface ClasePlanificada {
  grupoId: string;
  grupoNombre: string;
  horaInicio: string;
  horaFin: string;
  /** Nombres de pila de quienes la dictan, en el orden en que vienen. */
  profesores: string[];
  /** `true` si quien mira está asignada a la clase (`turno_profesores`). */
  esMia: boolean;
  /** `null` cuando el turno de esa fecha todavía no existe. */
  turnoId: string | null;
  tienePlanificacion: boolean;
  estado: EstadoTurno;
  tipo: TipoTurno;
  /** El objetivo del mes del grupo, para el chip que lo abre. */
  objetivoDelMes: string | null;
}

/** Una fila de la vista por grupo: cómo viene el mes de ese grupo. */
export interface GrupoDelMes {
  grupoId: string;
  grupoNombre: string;
  /** «Mar y vie», «Lun, mié y vie», «Sáb». */
  diasLabel: string;
  /** Fechas del mes en las que el grupo tiene clase. */
  totalFechas: number;
  /** De esas fechas, cuántas ya tienen planificación cargada. */
  cargadas: number;
  objetivoDelMes: string | null;
}

interface GrupoConHorarios {
  id: string;
  nombre: string;
  grupo_horarios: BloqueHorario[] | null;
}

interface TurnoDelMes {
  id: string;
  fecha: string;
  grupo_id: string | null;
  estado: EstadoTurno;
  tipo: TipoTurno;
  planificacion: string | null;
  profesores: { profesor_id: string; profesor: { nombre: string } | null }[] | null;
}

async function leerGruposConHorarios(supabase: Supabase): Promise<GrupoConHorarios[]> {
  const { data } = await supabase
    .from("grupos")
    .select("id, nombre, grupo_horarios(dias, hora_inicio, hora_fin)")
    .order("nombre");

  return (data ?? []) as unknown as GrupoConHorarios[];
}

/** Los turnos de un rango de fechas, con sus profesores asignados. */
async function leerTurnos(
  supabase: Supabase,
  desde: string,
  hasta: string
): Promise<TurnoDelMes[]> {
  const { data } = await supabase
    .from("turnos")
    .select(
      "id, fecha, grupo_id, estado, tipo, planificacion, profesores:turno_profesores(profesor_id, profesor:users(nombre))"
    )
    .gte("fecha", desde)
    .lte("fecha", hasta);

  return (data ?? []) as unknown as TurnoDelMes[];
}

/** Los objetivos del mes de todos los grupos, en una lectura. */
async function leerObjetivosDelMes(
  supabase: Supabase,
  mesISO: string
): Promise<Map<string, string>> {
  const { data } = await supabase
    .from("grupo_objetivos_mes")
    .select("grupo_id, objetivo")
    .eq("mes", mesISO);

  const porGrupo = new Map<string, string>();
  for (const fila of data ?? []) {
    if (fila.objetivo) porGrupo.set(fila.grupo_id, fila.objetivo);
  }
  return porGrupo;
}

/** El bloque horario que cubre un día ISO. Acá el sábado no se descarta. */
function bloqueDeEseDia(horarios: BloqueHorario[], diaIso: number): BloqueHorario | null {
  return horarios.find((bloque) => bloque.dias.includes(diaIso)) ?? null;
}

/** Días ISO en los que el grupo entrena, sábado incluido. */
function diasDeClase(horarios: BloqueHorario[]): number[] {
  const dias = new Set<number>();
  for (const bloque of horarios) {
    for (const dia of bloque.dias) dias.add(dia);
  }
  return [...dias].sort((a, b) => a - b);
}

/** «Mar y vie», «Lun, mié y vie», «Sin horario cargado». */
export function etiquetaDeDias(diasIso: number[]): string {
  if (diasIso.length === 0) return "Sin horario cargado";

  const nombres = diasIso.map((dia) => nombreDia(dia).slice(0, 3).toLowerCase());
  const capitalizado = nombres.map((n, i) => (i === 0 ? n[0].toUpperCase() + n.slice(1) : n));

  if (capitalizado.length === 1) return capitalizado[0];
  return `${capitalizado.slice(0, -1).join(", ")} y ${capitalizado[capitalizado.length - 1]}`;
}

/**
 * Las clases de una fecha, ordenadas por hora de inicio.
 *
 * `profileId` marca cuáles son «Mis clases»: es la asignación real de
 * `turno_profesores`, así que una fecha sin turno creado todavía nunca sale
 * marcada — no hay a quién atribuírsela hasta que alguien la cargue.
 */
export async function clasesPlanificadasDelDia(
  supabase: Supabase,
  fecha: string,
  profileId: string
): Promise<ClasePlanificada[]> {
  const diaIso = diaIsoDeFecha(fecha);
  const mesISO = primerDiaDeMes(Number(fecha.slice(0, 4)), Number(fecha.slice(5, 7)));

  const [grupos, turnos, objetivos] = await Promise.all([
    leerGruposConHorarios(supabase),
    leerTurnos(supabase, fecha, fecha),
    leerObjetivosDelMes(supabase, mesISO),
  ]);

  const turnoPorGrupo = new Map<string, TurnoDelMes>();
  for (const turno of turnos) {
    if (turno.grupo_id) turnoPorGrupo.set(turno.grupo_id, turno);
  }

  const clases: ClasePlanificada[] = [];

  for (const grupo of grupos) {
    const bloque = bloqueDeEseDia(grupo.grupo_horarios ?? [], diaIso);
    if (!bloque) continue;

    const turno = turnoPorGrupo.get(grupo.id);
    const asignados = turno?.profesores ?? [];

    clases.push({
      grupoId: grupo.id,
      grupoNombre: grupo.nombre,
      horaInicio: bloque.hora_inicio,
      horaFin: bloque.hora_fin,
      profesores: asignados.map((p) => p.profesor?.nombre ?? "").filter(Boolean),
      esMia: asignados.some((p) => p.profesor_id === profileId),
      turnoId: turno?.id ?? null,
      tienePlanificacion: !!turno?.planificacion,
      estado: turno?.estado ?? "Activo",
      tipo: turno?.tipo ?? "Patín",
      objetivoDelMes: objetivos.get(grupo.id) ?? null,
    });
  }

  return clases.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
}

/**
 * Cómo viene el mes, grupo por grupo: qué días entrena, cuántas de sus fechas
 * tienen planificación y si le falta el objetivo.
 *
 * Es lo que la pantalla de grupos no decía — eran cinco nombres y había que
 * entrar a cada uno para saber dónde quedaba trabajo pendiente.
 */
export async function gruposDelMes(
  supabase: Supabase,
  anio: number,
  mes: number
): Promise<GrupoDelMes[]> {
  const mesISO = primerDiaDeMes(anio, mes);
  const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const finISO = `${mesISO.slice(0, 8)}${String(ultimoDia).padStart(2, "0")}`;

  const [grupos, turnos, objetivos] = await Promise.all([
    leerGruposConHorarios(supabase),
    leerTurnos(supabase, mesISO, finISO),
    leerObjetivosDelMes(supabase, mesISO),
  ]);

  const conPlanificacionPorGrupo = new Map<string, Set<string>>();
  for (const turno of turnos) {
    if (!turno.grupo_id || !turno.planificacion) continue;
    const fechas = conPlanificacionPorGrupo.get(turno.grupo_id) ?? new Set<string>();
    fechas.add(turno.fecha);
    conPlanificacionPorGrupo.set(turno.grupo_id, fechas);
  }

  return grupos.map((grupo) => {
    const dias = diasDeClase(grupo.grupo_horarios ?? []);
    const fechasDelMes = dias.flatMap((dia) => fechasDelMesPorDia(anio, mes, dia));
    const cargadas = conPlanificacionPorGrupo.get(grupo.id) ?? new Set<string>();

    return {
      grupoId: grupo.id,
      grupoNombre: grupo.nombre,
      diasLabel: etiquetaDeDias(dias),
      totalFechas: fechasDelMes.length,
      cargadas: fechasDelMes.filter((fecha) => cargadas.has(fecha)).length,
      objetivoDelMes: objetivos.get(grupo.id) ?? null,
    };
  });
}

/**
 * Cuántas planificaciones le faltan a quien mira, en el mes de `fecha`.
 *
 * Se cuenta solo sobre los grupos donde ya tiene alguna clase asignada ese mes:
 * es «lo tuyo que falta», no el trabajo pendiente de todo el club. Devuelve
 * `null` cuando no hay nada que recordar.
 */
export async function planificacionesQueMeFaltan(
  supabase: Supabase,
  fecha: string,
  profileId: string
): Promise<{ faltan: number; grupoNombre: string } | null> {
  const anio = Number(fecha.slice(0, 4));
  const mes = Number(fecha.slice(5, 7));
  const mesISO = primerDiaDeMes(anio, mes);
  const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const finISO = `${mesISO.slice(0, 8)}${String(ultimoDia).padStart(2, "0")}`;

  const [grupos, turnos] = await Promise.all([
    leerGruposConHorarios(supabase),
    leerTurnos(supabase, mesISO, finISO),
  ]);

  const misGrupos = new Set<string>();
  for (const turno of turnos) {
    const mia = (turno.profesores ?? []).some((p) => p.profesor_id === profileId);
    if (mia && turno.grupo_id) misGrupos.add(turno.grupo_id);
  }
  if (misGrupos.size === 0) return null;

  const conPlanificacion = new Set(
    turnos.filter((t) => t.planificacion && t.grupo_id).map((t) => `${t.grupo_id}|${t.fecha}`)
  );

  let faltan = 0;
  let grupoNombre = "";

  for (const grupo of grupos) {
    if (!misGrupos.has(grupo.id)) continue;

    const fechas = diasDeClase(grupo.grupo_horarios ?? []).flatMap((dia) =>
      fechasDelMesPorDia(anio, mes, dia)
    );
    const sinCargar = fechas.filter((f) => !conPlanificacion.has(`${grupo.id}|${f}`)).length;

    if (sinCargar > 0) {
      faltan += sinCargar;
      // Con más de un grupo pendiente el aviso nombra el primero: el detalle
      // está a un toque en «Por grupo», y el aviso es un recordatorio, no un
      // listado.
      grupoNombre ||= grupo.nombre;
    }
  }

  return faltan > 0 ? { faltan, grupoNombre } : null;
}
