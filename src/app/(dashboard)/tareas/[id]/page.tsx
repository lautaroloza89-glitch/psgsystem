import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeCambiarEstadoTarea, puedeEditarTarea, puedeVerModuloTareas } from "@/lib/permisos";
import { MenuTarea } from "@/components/tareas/MenuTarea";
import { PieEstadoTarea } from "@/components/tareas/PieEstadoTarea";
import { ComentariosList, type ComentarioData } from "@/components/tareas/ComentariosList";
import { ComentarioForm } from "@/components/tareas/ComentarioForm";
import { BackButton } from "@/components/ui/BackButton";
import { UsuarioRolCargo } from "@/components/ui/UsuarioRolCargo";
import { MarkdownText } from "@/components/ui/MarkdownText";
import { cuandoVence } from "@/lib/tareas/agenda";
import { formatFecha, hoyArgentina } from "@/lib/utils/date";
import type { EstadoTarea, Rol } from "@/types";

export const metadata: Metadata = { title: "Detalle de tarea" };

export default async function TareaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentUserProfile();

  if (!puedeVerModuloTareas(profile)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const { data: tarea } = await supabase
    .from("tareas")
    .select(
      "id, titulo, descripcion, estado, fecha_inicio, fecha_vencimiento, created_by, tarea_asignados(usuario_id, users(nombre, rol, cargo))"
    )
    .eq("id", id)
    .single();

  if (!tarea) {
    notFound();
  }

  const { data: comentariosData } = await supabase
    .from("tarea_comentarios")
    .select("id, comentario, created_at, users(nombre, rol, cargo)")
    .eq("tarea_id", id)
    .order("created_at", { ascending: true });

  const comentarios: ComentarioData[] = (comentariosData ?? []).map((c) => ({
    id: c.id,
    comentario: c.comentario,
    created_at: c.created_at,
    autor: c.users
      ? (c.users as unknown as { nombre: string; rol: Rol; cargo: string | null })
      : null,
  }));

  const asignados = (tarea.tarea_asignados ?? []).flatMap((a) =>
    a.users
      ? [
          {
            id: a.usuario_id,
            nombre: (a.users as unknown as { nombre: string }).nombre,
            rol: (a.users as unknown as { rol: Rol }).rol,
            cargo: (a.users as unknown as { cargo: string | null }).cargo,
          },
        ]
      : []
  );

  const estado = tarea.estado as EstadoTarea;
  const hoy = hoyArgentina();
  const vencida = !!tarea.fecha_vencimiento && tarea.fecha_vencimiento < hoy && estado !== "Completada";

  const puedeEditar = puedeEditarTarea(profile, tarea);
  const puedeCambiarEstado = puedeCambiarEstadoTarea(profile, tarea);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* El título sube al header y el contenido arranca más arriba. */}
      <div className="flex items-start gap-2">
        <BackButton href="/tareas" />
        <div className="min-w-0 flex-1 pt-1">
          <h1 className="text-xl font-bold leading-snug tracking-tight">{tarea.titulo}</h1>
          <p className="text-sm text-text-subtle">
            <span className={vencida ? "font-medium text-error-600" : ""}>
              {cuandoVence(tarea.fecha_vencimiento, hoy)}
            </span>
            {estado === "En progreso" && " · En progreso"}
            {estado === "Completada" && " · Completada"}
          </p>
        </div>
        <MenuTarea
          tareaId={tarea.id}
          puedeEditar={puedeEditar}
          puedeBorrar={profile.rol === "Admin"}
        />
      </div>

      {tarea.descripcion && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <MarkdownText texto={tarea.descripcion} className="space-y-2 text-base text-text-muted" />
        </div>
      )}

      {tarea.fecha_inicio && (
        <p className="px-1 text-sm text-text-subtle">
          Empieza el {formatFecha(tarea.fecha_inicio)}
        </p>
      )}

      {asignados.length > 0 && (
        <section aria-labelledby="responsables-titulo">
          <h2
            id="responsables-titulo"
            className="px-1 pb-2 text-sm font-semibold uppercase tracking-wide text-text-subtle"
          >
            {asignados.length === 1 ? "Responsable" : "Responsables"}
          </h2>
          <ul className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
            {asignados.map((a) => (
              <li key={a.id} className="px-4 py-3">
                <UsuarioRolCargo nombre={a.nombre} rol={a.rol} cargo={a.cargo} conAvatar />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Los comentarios suben: es donde se coordina de verdad. */}
      <section aria-labelledby="comentarios-titulo" className="space-y-3">
        <h2
          id="comentarios-titulo"
          className="px-1 text-sm font-semibold uppercase tracking-wide text-text-subtle"
        >
          Comentarios
        </h2>
        <ComentariosList comentarios={comentarios} />
        <ComentarioForm tareaId={tarea.id} />
      </section>

      {puedeCambiarEstado && <PieEstadoTarea tareaId={tarea.id} estado={estado} />}
    </div>
  );
}
