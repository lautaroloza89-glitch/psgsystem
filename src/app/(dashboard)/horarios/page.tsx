import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { FiltroEstadoTurnoTabs } from "@/components/horarios/FiltroEstadoTurnoTabs";
import { TurnoCard, type TurnoCardData } from "@/components/horarios/TurnoCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { EstadoTurno } from "@/types";

const MENSAJE_VACIO: Record<EstadoTurno | "Todas", string> = {
  Todas: "No hay turnos para mostrar.",
  Activo: "No hay turnos activos.",
  Cancelado: "No hay turnos cancelados.",
};

export const metadata: Metadata = { title: "Horarios" };

const ESTADOS_VALIDOS: EstadoTurno[] = ["Activo", "Cancelado"];

export default async function HorariosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const filtroEstado = ESTADOS_VALIDOS.includes(estado as EstadoTurno)
    ? (estado as EstadoTurno)
    : null;

  const profile = await getCurrentUserProfile();
  const supabase = await createClient();

  let query = supabase
    .from("turnos")
    .select(
      "id, fecha, hora_inicio, hora_fin, grupo_nivel, capacidad, estado, profesor:users(nombre)"
    )
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true });

  if (filtroEstado) {
    query = query.eq("estado", filtroEstado);
  }

  const { data } = await query;

  const turnos: TurnoCardData[] = (data ?? []).map((turno) => ({
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

  const puedeCrear = profile?.rol === "Admin" || profile?.rol === "Profesor";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Horarios</h1>
        {puedeCrear && (
          <Link
            href="/horarios/nuevo"
            className="rounded-md bg-primary-500 px-5 py-2.5 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Nuevo turno
          </Link>
        )}
      </div>

      <FiltroEstadoTurnoTabs actual={filtroEstado ?? "Todas"} />

      {turnos.length === 0 ? (
        <EmptyState mensaje={MENSAJE_VACIO[filtroEstado ?? "Todas"]} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {turnos.map((turno) => (
            <TurnoCard key={turno.id} turno={turno} />
          ))}
        </div>
      )}
    </div>
  );
}
