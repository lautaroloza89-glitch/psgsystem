import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { TareaCard, type TareaCardData } from "@/components/tareas/TareaCard";
import { TurnoCard, type TurnoCardData } from "@/components/horarios/TurnoCard";
import { StatCard } from "@/components/dashboard/StatCard";
import type { EstadoTarea, EstadoTurno } from "@/types";

const LIMITE_ITEMS = 5;

export default async function DashboardPage() {
  const profile = await getCurrentUserProfile();
  const supabase = await createClient();

  const hoy = new Date();
  const hoyStr = hoy.toISOString().slice(0, 10);

  // Tareas próximas a vencer: no completadas, ordenadas por fecha de
  // vencimiento (las vencidas quedan primero al ser las más antiguas).
  // Misma tabla y sin filtro de usuario: la RLS del Módulo 3 ya limita
  // lo que cada rol puede ver (Admin todo, Profesor/Empleado lo suyo).
  const { data: tareasData } = await supabase
    .from("tareas")
    .select(
      "id, titulo, estado, fecha_vencimiento, tarea_asignados(usuario_id, users(nombre))"
    )
    .neq("estado", "Completada")
    .order("fecha_vencimiento", { ascending: true, nullsFirst: false })
    .limit(LIMITE_ITEMS);

  const tareasProximas: TareaCardData[] = (tareasData ?? []).map((tarea) => ({
    id: tarea.id,
    titulo: tarea.titulo,
    estado: tarea.estado as EstadoTarea,
    fecha_vencimiento: tarea.fecha_vencimiento,
    asignados: (tarea.tarea_asignados ?? []).flatMap((a) =>
      a.users ? [{ nombre: (a.users as unknown as { nombre: string }).nombre }] : []
    ),
  }));

  // Próximos turnos: el horario es compartido (la RLS deja verlo completo
  // a cualquier autenticado), así que se muestra igual para los 3 roles.
  const { data: turnosData } = await supabase
    .from("turnos")
    .select(
      "id, fecha, hora_inicio, hora_fin, grupo_nivel, capacidad, estado, profesor:users(nombre)"
    )
    .eq("estado", "Activo")
    .gte("fecha", hoyStr)
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true })
    .limit(LIMITE_ITEMS);

  const turnosProximos: TurnoCardData[] = (turnosData ?? []).map((turno) => ({
    id: turno.id,
    fecha: turno.fecha,
    hora_inicio: turno.hora_inicio,
    hora_fin: turno.hora_fin,
    grupo_nivel: turno.grupo_nivel,
    capacidad: turno.capacidad,
    estado: turno.estado as EstadoTurno,
    profesorNombre: turno.profesor
      ? (turno.profesor as unknown as { nombre: string }).nombre
      : null,
  }));

  // Contadores agregados: solo para Admin (panorama general del equipo).
  let contadores: {
    pendientes: number;
    enProgreso: number;
    turnosHoy: number;
    turnosSemana: number;
  } | null = null;

  if (profile?.rol === "Admin") {
    const en7Dias = new Date(hoy);
    en7Dias.setDate(en7Dias.getDate() + 7);
    const en7DiasStr = en7Dias.toISOString().slice(0, 10);

    const [pendientesRes, enProgresoRes, turnosHoyRes, turnosSemanaRes] =
      await Promise.all([
        supabase
          .from("tareas")
          .select("*", { count: "exact", head: true })
          .eq("estado", "Pendiente"),
        supabase
          .from("tareas")
          .select("*", { count: "exact", head: true })
          .eq("estado", "En progreso"),
        supabase
          .from("turnos")
          .select("*", { count: "exact", head: true })
          .eq("estado", "Activo")
          .eq("fecha", hoyStr),
        supabase
          .from("turnos")
          .select("*", { count: "exact", head: true })
          .eq("estado", "Activo")
          .gte("fecha", hoyStr)
          .lte("fecha", en7DiasStr),
      ]);

    contadores = {
      pendientes: pendientesRes.count ?? 0,
      enProgreso: enProgresoRes.count ?? 0,
      turnosHoy: turnosHoyRes.count ?? 0,
      turnosSemana: turnosSemanaRes.count ?? 0,
    };
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      {contadores && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Tareas pendientes" value={contadores.pendientes} />
          <StatCard label="Tareas en progreso" value={contadores.enProgreso} />
          <StatCard label="Turnos hoy" value={contadores.turnosHoy} />
          <StatCard label="Turnos esta semana" value={contadores.turnosSemana} />
        </div>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tareas próximas a vencer</h2>
          <Link
            href="/tareas"
            className="rounded text-sm text-text-subtle transition-colors duration-[var(--duration-fast)] ease-standard hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Ver todas
          </Link>
        </div>
        {tareasProximas.length === 0 ? (
          <p className="text-sm text-text-subtle">No hay tareas pendientes.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tareasProximas.map((tarea) => (
              <TareaCard key={tarea.id} tarea={tarea} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Próximos turnos</h2>
          <Link
            href="/horarios"
            className="rounded text-sm text-text-subtle transition-colors duration-[var(--duration-fast)] ease-standard hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Ver todos
          </Link>
        </div>
        {turnosProximos.length === 0 ? (
          <p className="text-sm text-text-subtle">No hay turnos próximos.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {turnosProximos.map((turno) => (
              <TurnoCard key={turno.id} turno={turno} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
