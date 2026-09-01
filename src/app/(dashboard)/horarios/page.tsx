import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { FiltroEstadoTurnoTabs } from "@/components/horarios/FiltroEstadoTurnoTabs";
import { TurnoCard, type TurnoCardData } from "@/components/horarios/TurnoCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { EstadoTurno, Rol } from "@/types";

const MENSAJE_VACIO: Record<EstadoTurno | "Todas", string> = {
  Todas: "No hay clases para mostrar.",
  Activo: "No hay clases activas.",
  Cancelado: "No hay clases canceladas.",
};

export const metadata: Metadata = { title: "Planificaciones" };

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

  const supabase = await createClient();

  let query = supabase
    .from("turnos")
    .select(
      "id, fecha, hora_inicio, hora_fin, grupo_legacy, grupo:grupos(nombre), estado, tipo, profesores:turno_profesores(profesor:users(nombre, rol, cargo))"
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
    grupoNombre:
      (turno.grupo as unknown as { nombre: string } | null)?.nombre ??
      turno.grupo_legacy ??
      "Sin grupo",
    estado: turno.estado as EstadoTurno,
    tipo: turno.tipo,
    profesores: (
      turno.profesores as unknown as { profesor: { nombre: string; rol: Rol; cargo: string | null } }[]
    ).map((p) => p.profesor),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Planificaciones</h1>

      <Link
        href="/horarios/grupos"
        className="block rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-primary-600 shadow-xs hover:border-border-strong hover:text-primary-700"
      >
        Ver por grupo y mes →
      </Link>

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
