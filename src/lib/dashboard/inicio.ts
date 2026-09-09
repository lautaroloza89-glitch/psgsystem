import type { createClient } from "@/lib/supabase/server";
import { calcularAlertasInasistencia } from "@/lib/asistencia/alertas";
import { fechasAtrasadas } from "@/lib/asistencia/dia";
import { calcularDeudorasDelMes } from "@/lib/pagos/saldo";
import { mesActualISO } from "@/lib/pagos/reglas";
import { hoyArgentina } from "@/lib/utils/date";
import type { NombreIcono } from "@/lib/navegacion";
import type { User } from "@/types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Los datos del inicio, armados por rol.
 *
 * El inicio dejó de ser una pantalla igual para todos: los cuatro contadores
 * (que además solo veía Admin) se reemplazan por **avisos que llevan a algún
 * lado**. La regla es que solo aparece lo que hace falta atender: si no hay
 * nada, el bloque no está y la pantalla dice «Todo al día».
 */

export type TonoAviso = "urgente" | "atencion" | "calmo";

export interface Aviso {
  icono: NombreIcono;
  tono: TonoAviso;
  titulo: string;
  detalle: string;
  href: string;
}

export interface ClaseDeHoy {
  id: string;
  horaInicio: string;
  horaFin: string;
  grupoNombre: string;
  /** Vacío para las clases sin profesor asignado. */
  profesores: string[];
  planificada: boolean;
  asistenciaTomada: boolean;
  /** Solo se cuenta para las clases propias; en la vista del club sobra. */
  cantidadAlumnas: number | null;
}

export interface AccesoRapido {
  label: string;
  href: string;
  icono: NombreIcono;
}

export interface DatosInicio {
  tituloAvisos: string;
  avisos: Aviso[];
  clases: { titulo: string; verTodas: { label: string; href: string }; items: ClaseDeHoy[] } | null;
  accesos: AccesoRapido[];
}

function diasDesde(fecha: string, hoy: string): number {
  const ms = Date.parse(`${hoy}T00:00:00Z`) - Date.parse(`${fecha}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

function enPlural(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/**
 * Tareas sin completar cuyo vencimiento ya pasó. `soloDe` las acota a las
 * asignadas a una persona: una profesora no tiene por qué cargar con el
 * vencido del club entero.
 */
async function avisoTareasVencidas(
  supabase: Supabase,
  hoy: string,
  soloDe: string | null
): Promise<Aviso | null> {
  let query = supabase
    .from("tareas")
    .select("id, fecha_vencimiento, titulo, tarea_asignados!inner(usuario_id)")
    .neq("estado", "Completada")
    .lt("fecha_vencimiento", hoy)
    .order("fecha_vencimiento", { ascending: true });

  if (soloDe) query = query.eq("tarea_asignados.usuario_id", soloDe);

  const { data } = await query;
  const vencidas = data ?? [];
  if (vencidas.length === 0) return null;

  const masVieja = vencidas[0];
  const dias = masVieja.fecha_vencimiento ? diasDesde(masVieja.fecha_vencimiento, hoy) : 0;

  return {
    icono: "list-checks",
    tono: "urgente",
    titulo: soloDe
      ? `${enPlural(vencidas.length, "tarea tuya vencida", "tareas tuyas vencidas")}`
      : enPlural(vencidas.length, "tarea vencida", "tareas vencidas"),
    detalle:
      vencidas.length === 1
        ? `${masVieja.titulo} · hace ${enPlural(dias, "día", "días")}`
        : `La más vieja, hace ${enPlural(dias, "día", "días")}`,
    href: "/tareas",
  };
}

/** Pagos cargados que todavía nadie verificó. */
async function avisoPagosSinVerificar(
  supabase: Supabase,
  registradosPor: string | null
): Promise<Aviso | null> {
  let query = supabase
    .from("pagos")
    .select("id, registrado_por, users:registrado_por(nombre)")
    .eq("estado", "pendiente_verificar");

  if (registradosPor) query = query.eq("registrado_por", registradosPor);

  const { data } = await query;
  const pagos = data ?? [];
  if (pagos.length === 0) return null;

  const nombres = [
    ...new Set(
      pagos.flatMap((p) => {
        const u = p.users as unknown as { nombre: string } | null;
        return u ? [u.nombre.split(" ")[0]] : [];
      })
    ),
  ];

  return {
    icono: "money",
    tono: "atencion",
    titulo: registradosPor
      ? enPlural(pagos.length, "pago que cargaste", "pagos que cargaste")
      : enPlural(pagos.length, "pago sin verificar", "pagos sin verificar"),
    detalle: registradosPor
      ? "Esperando verificación"
      : nombres.length === 1
        ? `Cargados por ${nombres[0]}`
        : `Cargados por ${nombres.length} personas`,
    href: "/pagos/pendientes",
  };
}

/** Alumnas con 3 semanas seguidas sin venir (misma regla que /asistencia/alertas). */
async function avisoAusencias(supabase: Supabase): Promise<Aviso | null> {
  const alertas = await calcularAlertasInasistencia(supabase);
  if (alertas.length === 0) return null;

  const maxSemanas = Math.max(...alertas.map((a) => a.semanasSinPresente));

  return {
    icono: "users-three",
    tono: "atencion",
    titulo: enPlural(alertas.length, "alumna con ausencias", "alumnas con ausencias"),
    detalle: `${maxSemanas} semanas seguidas sin venir`,
    href: "/asistencia/alertas",
  };
}

/** Deudoras del mes en curso, con cuántas ya arrastran recargo. */
async function avisoDeudoras(supabase: Supabase): Promise<Aviso | null> {
  const mes = mesActualISO();
  const deudoras = await calcularDeudorasDelMes(supabase, mes);
  if (deudoras.length === 0) return null;

  const conRecargo = deudoras.filter((d) => d.diasAtraso > 0).length;

  return {
    icono: "money",
    tono: conRecargo > 0 ? "urgente" : "atencion",
    titulo: `${deudoras.length} ${deudoras.length === 1 ? "alumna debe" : "alumnas deben"} este mes`,
    detalle:
      conRecargo > 0
        ? `${conRecargo} con recargo desde el día 10`
        : "Todavía sin recargo",
    href: "/pagos/deudoras",
  };
}

/**
 * Clases ya pasadas (última semana) que quedaron sin cargar o a medio cargar.
 *
 * Delega en `fechasAtrasadas`, que es lo mismo que muestra el pie de
 * `/asistencia`: las dos pantallas tienen que contar igual. Desde que el
 * guardado es parcial, «tiene alguna fila» ya no significa «está cargada», así
 * que el conteo se hace contra las alumnas activas del grupo.
 */
async function avisoAsistenciaFaltante(supabase: Supabase, hoy: string): Promise<Aviso | null> {
  const faltantes = await fechasAtrasadas(supabase, hoy);
  if (faltantes.length === 0) return null;

  const dias = diasDesde(faltantes[0].fecha, hoy);

  return {
    icono: "check-square",
    tono: "atencion",
    titulo: `${enPlural(faltantes.length, "clase", "clases")} sin asistencia`,
    detalle:
      dias === 1 ? "La más vieja, de ayer" : `La más vieja, de hace ${dias} días`,
    href: "/asistencia",
  };
}

/**
 * Clases de hoy. `soloDe` las acota a las de una profesora vía
 * `turno_profesores` — hoy el inicio muestra los 5 turnos más próximos de todo
 * el club para cualquier rol, así que Caro ve clases que no da.
 */
async function clasesDeHoy(
  supabase: Supabase,
  hoy: string,
  soloDe: string | null
): Promise<ClaseDeHoy[]> {
  // El `!inner` va solo cuando se filtra por profesora: en la vista del club
  // dejaría afuera las clases que todavía no tienen a nadie asignado, que son
  // justo las que hay que mirar. Las dos consultas van escritas enteras porque
  // PostgREST infiere los tipos del `select` y necesita un literal.
  const { data } = soloDe
    ? await supabase
        .from("turnos")
        .select(
          "id, hora_inicio, hora_fin, grupo_id, grupo_legacy, planificacion, grupo:grupos(nombre), profesores:turno_profesores!inner(profesor_id, profesor:users(nombre))"
        )
        .eq("estado", "Activo")
        .eq("fecha", hoy)
        .eq("profesores.profesor_id", soloDe)
        .order("hora_inicio", { ascending: true })
    : await supabase
        .from("turnos")
        .select(
          "id, hora_inicio, hora_fin, grupo_id, grupo_legacy, planificacion, grupo:grupos(nombre), profesores:turno_profesores(profesor_id, profesor:users(nombre))"
        )
        .eq("estado", "Activo")
        .eq("fecha", hoy)
        .order("hora_inicio", { ascending: true });

  const turnos = data ?? [];
  if (turnos.length === 0) return [];

  const gruposIds = [...new Set(turnos.flatMap((t) => (t.grupo_id ? [t.grupo_id] : [])))];

  const [{ data: tomadas }, { data: alumnas }] = await Promise.all([
    supabase.from("asistencia").select("grupo_id").eq("fecha", hoy),
    gruposIds.length > 0
      ? supabase.from("alumnas").select("grupo_id").eq("estado", "activa").in("grupo_id", gruposIds)
      : Promise.resolve({ data: null }),
  ]);

  const alumnasPorGrupo = new Map<string, number>();
  for (const a of alumnas ?? []) {
    if (a.grupo_id) alumnasPorGrupo.set(a.grupo_id, (alumnasPorGrupo.get(a.grupo_id) ?? 0) + 1);
  }

  // Desde el rediseño del módulo 4 el guardado es parcial: una clase está
  // «tomada» cuando están marcadas todas las alumnas activas, no cuando hay
  // una fila suelta. Si no, el inicio diría que ya se cargó una clase que
  // alguien dejó por la mitad.
  const marcadasPorGrupo = new Map<string, number>();
  for (const a of tomadas ?? []) {
    if (a.grupo_id) marcadasPorGrupo.set(a.grupo_id, (marcadasPorGrupo.get(a.grupo_id) ?? 0) + 1);
  }

  function asistenciaCompleta(grupoId: string | null): boolean {
    if (!grupoId) return false;
    const total = alumnasPorGrupo.get(grupoId) ?? 0;
    return total > 0 && (marcadasPorGrupo.get(grupoId) ?? 0) >= total;
  }

  return turnos.map((t) => ({
    id: t.id,
    horaInicio: t.hora_inicio,
    horaFin: t.hora_fin,
    grupoNombre:
      (t.grupo as unknown as { nombre: string } | null)?.nombre ?? t.grupo_legacy ?? "Sin grupo",
    profesores: (
      t.profesores as unknown as { profesor: { nombre: string } | null }[]
    ).flatMap((p) => (p.profesor ? [p.profesor.nombre] : [])),
    planificada: !!t.planificacion,
    asistenciaTomada: asistenciaCompleta(t.grupo_id),
    cantidadAlumnas: soloDe && t.grupo_id ? (alumnasPorGrupo.get(t.grupo_id) ?? 0) : null,
  }));
}

export async function datosDelInicio(
  supabase: Supabase,
  profile: User
): Promise<DatosInicio> {
  const hoy = hoyArgentina();

  if (profile.rol === "Admin" || profile.rol === "Head Coach") {
    const [vencidas, pagos, ausencias, clases] = await Promise.all([
      avisoTareasVencidas(supabase, hoy, null),
      avisoPagosSinVerificar(supabase, null),
      avisoAusencias(supabase),
      clasesDeHoy(supabase, hoy, null),
    ]);

    return {
      tituloAvisos: "Requiere tu atención",
      avisos: [vencidas, pagos, ausencias].filter((a): a is Aviso => a !== null),
      clases: {
        titulo: "Hoy en el club",
        verTodas: { label: "Ver la semana", href: "/horarios" },
        items: clases,
      },
      accesos: [],
    };
  }

  if (profile.rol === "Secretaria") {
    const [deudoras, pagos, asistencia] = await Promise.all([
      avisoDeudoras(supabase),
      avisoPagosSinVerificar(supabase, profile.id),
      avisoAsistenciaFaltante(supabase, hoy),
    ]);

    return {
      // No es «Requiere tu atención» sino «Tu día»: son las tres cosas que
      // mira Dai a la mañana, no una bandeja de urgencias.
      tituloAvisos: "Tu día",
      avisos: [deudoras, pagos, asistencia].filter((a): a is Aviso => a !== null),
      clases: null,
      accesos: [
        { label: "Registrar pago", href: "/pagos/nuevo", icono: "money" },
        { label: "Nueva alumna", href: "/alumnas/nueva", icono: "users-three" },
      ],
    };
  }

  if (profile.rol === "Profesor" || profile.rol === "Empleado") {
    const daClases = profile.rol === "Profesor" || profile.dicta_clases;

    const [vencidas, clases] = await Promise.all([
      avisoTareasVencidas(supabase, hoy, profile.id),
      daClases ? clasesDeHoy(supabase, hoy, profile.id) : Promise.resolve([]),
    ]);

    return {
      tituloAvisos: "Requiere tu atención",
      avisos: [vencidas].filter((a): a is Aviso => a !== null),
      clases: daClases
        ? {
            titulo: "Tus clases de hoy",
            verTodas: { label: "Ver todas", href: "/horarios" },
            items: clases,
          }
        : null,
      accesos: [],
    };
  }

  // Patinador/a: hoy no hay forma de saber qué alumna es cada usuario
  // (`alumnas` no tiene FK a `users`, decisión de producto vigente), así que
  // su clase, su grupo y su cuota no se pueden mostrar. Ver docs/pendientes.md.
  return { tituloAvisos: "", avisos: [], clases: null, accesos: [] };
}
