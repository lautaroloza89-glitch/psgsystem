import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { EstadoTurnoBadge } from "@/components/horarios/EstadoTurnoBadge";
import { ToggleEstadoTurnoButton } from "@/components/horarios/ToggleEstadoTurnoButton";
import { BorrarTurnoButton } from "@/components/horarios/BorrarTurnoButton";
import { ComentariosTurnoList, type ComentarioTurnoData } from "@/components/horarios/ComentariosTurnoList";
import { ComentarioTurnoForm } from "@/components/horarios/ComentarioTurnoForm";
import { BackButton } from "@/components/ui/BackButton";
import { MarkdownText } from "@/components/ui/MarkdownText";
import { formatFecha } from "@/lib/utils/date";
import type { EstadoTurno, Rol } from "@/types";

export const metadata: Metadata = { title: "Detalle de clase" };

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
      "id, fecha, hora_inicio, hora_fin, grupo_id, grupo_legacy, grupo:grupos(nombre), estado, tipo, planificacion, profesores:turno_profesores(profesor_id, profesor:users(nombre))"
    )
    .eq("id", id)
    .single();

  if (!turno) {
    notFound();
  }

  const { data: comentariosData } = await supabase
    .from("turno_comentarios")
    .select("id, comentario, created_at, users(nombre, rol, cargo)")
    .eq("turno_id", id)
    .order("created_at", { ascending: true });

  const comentarios: ComentarioTurnoData[] = (comentariosData ?? []).map((c) => ({
    id: c.id,
    comentario: c.comentario,
    created_at: c.created_at,
    autor: c.users
      ? (c.users as unknown as { nombre: string; rol: Rol; cargo: string | null })
      : null,
  }));

  const profesoresAsignados = turno.profesores as unknown as {
    profesor_id: string;
    profesor: { nombre: string };
  }[];

  const profesoresNombres = profesoresAsignados.map((p) => p.profesor.nombre);

  const grupoNombre =
    (turno.grupo as unknown as { nombre: string } | null)?.nombre ??
    turno.grupo_legacy ??
    "Sin grupo";

  const puedeEditar =
    !!profile &&
    (profile.rol === "Admin" ||
      profile.rol === "Head Coach" ||
      (profile.rol === "Profesor" &&
        profesoresAsignados.some((p) => p.profesor_id === profile.id)));

  // Vuelve al mes del grupo del que viene la planificación; si la clase es de las viejas
  // (sin grupo_id mapeado), al selector de grupos.
  const volverA = turno.grupo_id
    ? `/horarios/grupos/${turno.grupo_id}?mes=${turno.fecha.slice(0, 7)}`
    : "/horarios";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton href={volverA} />

      <div className="space-y-6 rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {grupoNombre}
            {turno.tipo === "Preparación física" && (
              <span className="ml-2 text-base font-normal text-text-subtle">
                (Preparación física)
              </span>
            )}
          </h1>
          <EstadoTurnoBadge estado={turno.estado as EstadoTurno} />
        </div>

        <div className="space-y-1 text-base text-text-muted">
          <p>Fecha: {formatFecha(turno.fecha)}</p>
          <p>
            Horario: {turno.hora_inicio.slice(0, 5)}–{turno.hora_fin.slice(0, 5)}
          </p>
          <p>
            {profesoresNombres.length > 1 ? "Profesores" : "Profesor"}:{" "}
            {profesoresNombres.length > 0 ? profesoresNombres.join(", ") : "Sin asignar"}
          </p>
        </div>

        {puedeEditar && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/horarios/${turno.id}/editar`}
              className="inline-block rounded-md border border-border-strong px-4 py-2 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:border-neutral-400 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Editar clase
            </Link>
            <ToggleEstadoTurnoButton
              turnoId={turno.id}
              estadoActual={turno.estado as EstadoTurno}
            />
          </div>
        )}

        {profile?.rol === "Admin" && <BorrarTurnoButton turnoId={turno.id} />}
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold">Planificación</h2>
          {puedeEditar && (
            <Link
              href={`/horarios/${turno.id}/duplicar`}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Duplicar a otra fecha
            </Link>
          )}
        </div>
        {turno.planificacion ? (
          <MarkdownText texto={turno.planificacion} />
        ) : (
          <p className="text-sm text-text-subtle">Todavía no se cargó una planificación.</p>
        )}
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <h2 className="text-lg font-semibold">Comentarios</h2>
        <ComentariosTurnoList comentarios={comentarios} />
        <ComentarioTurnoForm turnoId={turno.id} />
      </div>
    </div>
  );
}
