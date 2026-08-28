import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { EstadoTurnoBadge } from "@/components/horarios/EstadoTurnoBadge";
import { ToggleEstadoTurnoButton } from "@/components/horarios/ToggleEstadoTurnoButton";
import { BorrarTurnoButton } from "@/components/horarios/BorrarTurnoButton";
import { BackButton } from "@/components/ui/BackButton";
import { formatFecha } from "@/lib/utils/date";
import type { EstadoTurno } from "@/types";

export const metadata: Metadata = { title: "Detalle de turno" };

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
      "id, fecha, hora_inicio, hora_fin, grupo_nivel, profesor_id, estado, profesor:users(nombre)"
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
      profile.rol === "Head Coach" ||
      (profile.rol === "Profesor" && turno.profesor_id === profile.id));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton href="/horarios" />

      <div className="space-y-6 rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{turno.grupo_nivel}</h1>
          <EstadoTurnoBadge estado={turno.estado as EstadoTurno} />
        </div>

        <div className="space-y-1 text-base text-text-muted">
          <p>Fecha: {formatFecha(turno.fecha)}</p>
          <p>
            Horario: {turno.hora_inicio.slice(0, 5)}–{turno.hora_fin.slice(0, 5)}
          </p>
          <p>Profesor: {profesorNombre ?? "Sin asignar"}</p>
        </div>

        {puedeEditar && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/horarios/${turno.id}/editar`}
              className="inline-block rounded-md border border-border-strong px-4 py-2 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:border-neutral-400 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
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
    </div>
  );
}
