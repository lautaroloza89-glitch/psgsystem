import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { EstadoTurnoBadge } from "@/components/horarios/EstadoTurnoBadge";
import { ToggleEstadoTurnoButton } from "@/components/horarios/ToggleEstadoTurnoButton";
import { BorrarTurnoButton } from "@/components/horarios/BorrarTurnoButton";
import { formatFecha } from "@/lib/utils/date";
import type { EstadoTurno } from "@/types";

export default async function TurnoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentUserProfile();
  const supabase = await createClient();

  const { data: turno } = await supabase
    .from("turnos")
    .select(
      "id, fecha, hora_inicio, hora_fin, grupo_nivel, capacidad, profesor_id, estado, profesor:users(nombre)"
    )
    .eq("id", id)
    .single();

  if (!turno) {
    notFound();
  }

  const profesorNombre = turno.profesor
    ? (turno.profesor as unknown as { nombre: string }).nombre
    : null;

  const puedeEditar =
    !!profile &&
    (profile.rol === "Admin" ||
      (profile.rol === "Profesor" && turno.profesor_id === profile.id));

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <Link href="/horarios" className="text-sm text-black/50 hover:text-black">
          ← Volver a horarios
        </Link>
      </div>

      <div className="flex items-start justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{turno.grupo_nivel}</h1>
        <EstadoTurnoBadge estado={turno.estado as EstadoTurno} />
      </div>

      <div className="space-y-1 text-base text-black/70">
        <p>Fecha: {formatFecha(turno.fecha)}</p>
        <p>
          Horario: {turno.hora_inicio.slice(0, 5)}–{turno.hora_fin.slice(0, 5)}
        </p>
        <p>Profesor: {profesorNombre ?? "Sin asignar"}</p>
        <p>Capacidad: {turno.capacidad}</p>
      </div>

      {puedeEditar && (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/horarios/${turno.id}/editar`}
            className="inline-block rounded border border-black/20 px-4 py-2 text-sm font-medium hover:border-black/40"
          >
            Editar turno
          </Link>
          <ToggleEstadoTurnoButton
            turnoId={turno.id}
            estadoActual={turno.estado as EstadoTurno}
          />
        </div>
      )}

      {profile?.rol === "Admin" && <BorrarTurnoButton turnoId={turno.id} />}
    </div>
  );
}
