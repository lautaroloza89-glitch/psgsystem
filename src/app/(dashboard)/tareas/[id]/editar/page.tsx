import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeEditarTarea, puedeVerModuloTareas } from "@/lib/permisos";
import { TareaForm } from "@/components/tareas/TareaForm";
import { BackButton } from "@/components/ui/BackButton";
import { leerPersonalAsignableConActuales } from "@/lib/tareas/asignables";
import { hoyArgentina } from "@/lib/utils/date";
import { editarTarea } from "../../actions";

export const metadata: Metadata = { title: "Editar tarea" };

export default async function EditarTareaPage({
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
      "id, titulo, descripcion, fecha_inicio, fecha_vencimiento, created_by, tarea_asignados(usuario_id)"
    )
    .eq("id", id)
    .single();

  if (!tarea) {
    notFound();
  }

  const asignadosIds = (tarea.tarea_asignados ?? []).map((a) => a.usuario_id);

  if (!puedeEditarTarea(profile, tarea)) {
    redirect(`/tareas/${id}`);
  }

  // Con los actuales incluidos: un responsable que hoy no sería asignable
  // tiene que seguir apareciendo tildado, o al guardar se borraría solo.
  const usuarios = await leerPersonalAsignableConActuales(supabase, asignadosIds);

  const editarTareaConId = editarTarea.bind(null, id);

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <BackButton href={`/tareas/${id}`} />
      <h1 className="text-2xl font-bold tracking-tight">Editar tarea</h1>
      <TareaForm
        action={editarTareaConId}
        usuarios={usuarios}
        modo="editar"
        hoy={hoyArgentina()}
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
