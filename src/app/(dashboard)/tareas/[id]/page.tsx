import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { EstadoBadge } from "@/components/tareas/EstadoBadge";
import { EstadoSelector } from "@/components/tareas/EstadoSelector";
import { ComentariosList, type ComentarioData } from "@/components/tareas/ComentariosList";
import { ComentarioForm } from "@/components/tareas/ComentarioForm";
import { formatFecha } from "@/lib/utils/date";
import type { EstadoTarea } from "@/types";

export default async function TareaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentUserProfile();
  const supabase = await createClient();

  const { data: tarea } = await supabase
    .from("tareas")
    .select(
      "id, titulo, descripcion, estado, fecha_inicio, fecha_vencimiento, created_by, tarea_asignados(usuario_id, users(nombre))"
    )
    .eq("id", id)
    .single();

  if (!tarea) {
    notFound();
  }

  const { data: comentariosData } = await supabase
    .from("tarea_comentarios")
    .select("id, comentario, created_at, users(nombre)")
    .eq("tarea_id", id)
    .order("created_at", { ascending: true });

  const comentarios: ComentarioData[] = (comentariosData ?? []).map((c) => ({
    id: c.id,
    comentario: c.comentario,
    created_at: c.created_at,
    autor: c.users ? { nombre: (c.users as unknown as { nombre: string }).nombre } : null,
  }));

  const asignados = (tarea.tarea_asignados ?? []).flatMap((a) =>
    a.users
      ? [{ id: a.usuario_id, nombre: (a.users as unknown as { nombre: string }).nombre }]
      : []
  );

  const estaAsignado = profile
    ? asignados.some((a) => a.id === profile.id)
    : false;

  const puedeEditar =
    !!profile &&
    (profile.rol === "Admin" ||
      (profile.rol === "Profesor" &&
        (tarea.created_by === profile.id || estaAsignado)));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/tareas" className="text-sm text-text-subtle hover:text-text">
          ← Volver a tareas
        </Link>
      </div>

      <div className="space-y-6 rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{tarea.titulo}</h1>
          <EstadoBadge estado={tarea.estado as EstadoTarea} />
        </div>

        {tarea.descripcion && (
          <p className="text-base text-text-muted">{tarea.descripcion}</p>
        )}

        <div className="flex gap-6 text-sm text-text-subtle">
          <span>Inicio: {formatFecha(tarea.fecha_inicio)}</span>
          <span>Vence: {formatFecha(tarea.fecha_vencimiento)}</span>
        </div>

        {asignados.length > 0 && (
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Responsables</h2>
            <p className="text-base text-text-muted">
              {asignados.map((a) => a.nombre).join(", ")}
            </p>
          </div>
        )}

        {puedeEditar && (
          <Link
            href={`/tareas/${tarea.id}/editar`}
            className="inline-block rounded-md border border-border-strong px-4 py-2 text-sm font-medium hover:border-neutral-400"
          >
            Editar tarea
          </Link>
        )}

        <EstadoSelector tareaId={tarea.id} estadoActual={tarea.estado as EstadoTarea} />
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <h2 className="text-lg font-semibold">Comentarios</h2>
        <ComentariosList comentarios={comentarios} />
        <ComentarioForm tareaId={tarea.id} />
      </div>
    </div>
  );
}
