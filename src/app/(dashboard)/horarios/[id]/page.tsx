import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import {
  puedeComentarClase,
  puedeEditarClase,
  puedeVerPlanificaciones,
} from "@/lib/permisos";
import { EstadoTurnoBadge } from "@/components/horarios/EstadoTurnoBadge";
import { ToggleEstadoTurnoButton } from "@/components/horarios/ToggleEstadoTurnoButton";
import { BorrarTurnoButton } from "@/components/horarios/BorrarTurnoButton";
import { ComentariosTurnoList, type ComentarioTurnoData } from "@/components/horarios/ComentariosTurnoList";
import { ComentarioTurnoForm } from "@/components/horarios/ComentarioTurnoForm";
import { BackButton } from "@/components/ui/BackButton";
import { MarkdownText } from "@/components/ui/MarkdownText";
import { Icono } from "@/components/ui/Icono";
import { fechaLargaConDia } from "@/lib/utils/date";
import type { EstadoTurno, Rol } from "@/types";

export const metadata: Metadata = { title: "Detalle de clase" };

export default async function TurnoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentUserProfile();
  if (!puedeVerPlanificaciones(profile)) {
    redirect("/dashboard");
  }

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

  const puedeEditar = puedeEditarClase(profile, profesoresAsignados);

  // Vuelve al mes del grupo del que viene la planificación; si la clase es de las viejas
  // (sin grupo_id mapeado), al selector de grupos.
  const volverA = turno.grupo_id
    ? `/horarios/grupos/${turno.grupo_id}?mes=${turno.fecha.slice(0, 7)}`
    : "/horarios";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton href={volverA} />

      <div className="space-y-5 rounded-xl border border-border bg-surface p-5 shadow-xs sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{grupoNombre}</h1>
            {/* La fecha en lenguaje natural, como en el resto del rediseño: el
                formato numérico obligaba a traducir «09/09/2026» a «miércoles»
                justo en la pantalla donde el día de la semana es el dato. */}
            <p className="mt-1 text-base text-text-muted">
              {fechaLargaConDia(turno.fecha)} · {turno.hora_inicio.slice(0, 5)}–
              {turno.hora_fin.slice(0, 5)}
            </p>
            <p className="text-base text-text-muted">
              {profesoresNombres.length > 0 ? profesoresNombres.join(", ") : "Sin profesora asignada"}
            </p>
          </div>
          <div className="flex flex-none flex-col items-end gap-2">
            {turno.estado === "Cancelado" && <EstadoTurnoBadge estado="Cancelado" />}
            {turno.tipo === "Preparación física" && (
              <span className="rounded-full bg-surface-muted px-2.5 py-1 text-sm font-medium text-text-muted">
                Prep. física
              </span>
            )}
            {!puedeEditar && (
              // Lo dice de entrada, sin que haya que descubrirlo tocando: el
              // rol ve el texto completo y los comentarios, pero no las
              // acciones.
              <span className="rounded-full border border-border bg-surface-muted px-3 py-1 text-sm font-medium text-text-muted">
                Solo lectura
              </span>
            )}
          </div>
        </div>

        {puedeEditar && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Link
              href={`/horarios/${turno.id}/editar`}
              className="inline-flex min-h-11 items-center rounded-md border border-border-strong px-4 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:border-neutral-400 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Editar clase
            </Link>
            <ToggleEstadoTurnoButton
              turnoId={turno.id}
              estadoActual={turno.estado as EstadoTurno}
            />
            {/* Borrar va al final y separado: es la única acción que no se
                deshace. Antes colgaba en una fila propia debajo de todo. */}
            {profile.rol === "Admin" && (
              <span className="ml-auto">
                <BorrarTurnoButton turnoId={turno.id} />
              </span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-surface p-5 shadow-xs sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold">Planificación</h2>
          {puedeEditar && turno.planificacion && (
            // Solo si hay algo que duplicar: el link aparecía igual sobre una
            // planificación vacía, y llevaba a un formulario que no se podía
            // guardar.
            <Link
              href={`/horarios/${turno.id}/duplicar`}
              className="inline-flex min-h-11 flex-none items-center gap-1.5 rounded-md border border-border-strong px-3 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:border-neutral-400 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <Icono nombre="note" className="h-4 w-4" />
              Duplicar
            </Link>
          )}
        </div>
        {turno.planificacion ? (
          <MarkdownText texto={turno.planificacion} />
        ) : (
          <p className="text-sm text-text-subtle">Todavía no se cargó una planificación.</p>
        )}
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-surface p-5 shadow-xs sm:p-6">
        <h2 className="text-lg font-semibold">Comentarios</h2>
        <ComentariosTurnoList comentarios={comentarios} />
        {puedeComentarClase(profile) ? (
          <ComentarioTurnoForm turnoId={turno.id} />
        ) : (
          <p className="text-sm text-text-subtle">No podés comentar en este rol.</p>
        )}
      </div>
    </div>
  );
}
