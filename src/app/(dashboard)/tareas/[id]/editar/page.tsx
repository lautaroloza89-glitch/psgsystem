import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { TareaForm } from "@/components/tareas/TareaForm";
import { editarTarea } from "../../actions";

export default async function EditarTareaPage({
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
      "id, titulo, descripcion, fecha_inicio, fecha_vencimiento, created_by, tarea_asignados(usuario_id)"
    )
    .eq("id", id)
    .single();

  if (!tarea) {
    notFound();
  }

  const asignadosIds = (tarea.tarea_asignados ?? []).map((a) => a.usuario_id);
  const estaAsignado = profile ? asignadosIds.includes(profile.id) : false;

  const puedeEditar =
    !!profile &&
    (profile.rol === "Admin" ||
      (profile.rol === "Profesor" &&
        (tarea.created_by === profile.id || estaAsignado)));

  if (!puedeEditar) {
    redirect(`/tareas/${id}`);
  }

  const { data: usuarios } = await supabase
    .from("users")
    .select("id, nombre, rol")
    .order("nombre");

  const editarTareaConId = editarTarea.bind(null, id);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Editar tarea</h1>
      <TareaForm
        action={editarTareaConId}
        usuarios={usuarios ?? []}
        modo="editar"
        defaultValues={{
          titulo: tarea.titulo,
          descripcion: tarea.descripcion ?? "",
          fecha_inicio: tarea.fecha_inicio ?? "",
          fecha_vencimiento: tarea.fecha_vencimiento ?? "",
          asignadosIds,
        }}
      />
    </div>
  );
}
