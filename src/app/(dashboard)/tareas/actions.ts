"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import type { EstadoTarea } from "@/types";

export interface FormState {
  error: string | null;
}

function leerCamposTarea(formData: FormData) {
  const titulo = (formData.get("titulo") as string)?.trim() ?? "";
  const descripcion = ((formData.get("descripcion") as string) ?? "").trim();
  const fecha_inicio = (formData.get("fecha_inicio") as string) || null;
  const fecha_vencimiento = (formData.get("fecha_vencimiento") as string) || null;
  const asignados = formData.getAll("asignados") as string[];

  return {
    titulo,
    descripcion: descripcion || null,
    fecha_inicio,
    fecha_vencimiento,
    asignados,
  };
}

export async function crearTarea(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.rol === "Empleado" || profile.rol === "Patinador") {
    return { error: "No tenés permiso para crear tareas." };
  }

  const { titulo, descripcion, fecha_inicio, fecha_vencimiento, asignados } =
    leerCamposTarea(formData);

  if (!titulo) {
    return { error: "El título es obligatorio." };
  }

  const supabase = await createClient();

  const { data: tarea, error } = await supabase
    .from("tareas")
    .insert({
      titulo,
      descripcion,
      fecha_inicio,
      fecha_vencimiento,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !tarea) {
    return { error: "No se pudo crear la tarea." };
  }

  if (asignados.length > 0) {
    const { error: asignadosError } = await supabase
      .from("tarea_asignados")
      .insert(asignados.map((usuario_id) => ({ tarea_id: tarea.id, usuario_id })));

    if (asignadosError) {
      return { error: "La tarea se creó, pero no se pudieron asignar los responsables." };
    }
  }

  revalidatePath("/tareas");
  redirect(`/tareas/${tarea.id}`);
}

export async function editarTarea(
  tareaId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.rol === "Empleado" || profile.rol === "Patinador") {
    return { error: "No tenés permiso para editar esta tarea." };
  }

  const { titulo, descripcion, fecha_inicio, fecha_vencimiento, asignados } =
    leerCamposTarea(formData);

  if (!titulo) {
    return { error: "El título es obligatorio." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("tareas")
    .update({ titulo, descripcion, fecha_inicio, fecha_vencimiento })
    .eq("id", tareaId);

  if (error) {
    return { error: "No se pudo actualizar la tarea." };
  }

  const { error: deleteError } = await supabase
    .from("tarea_asignados")
    .delete()
    .eq("tarea_id", tareaId);

  if (deleteError) {
    return { error: "No se pudieron actualizar los responsables." };
  }

  if (asignados.length > 0) {
    const { error: insertError } = await supabase
      .from("tarea_asignados")
      .insert(asignados.map((usuario_id) => ({ tarea_id: tareaId, usuario_id })));

    if (insertError) {
      return { error: "No se pudieron actualizar los responsables." };
    }
  }

  revalidatePath(`/tareas/${tareaId}`);
  revalidatePath("/tareas");
  redirect(`/tareas/${tareaId}`);
}

export async function actualizarEstadoTarea(
  tareaId: string,
  estado: EstadoTarea
): Promise<FormState> {
  const supabase = await createClient();

  const { error } = await supabase.from("tareas").update({ estado }).eq("id", tareaId);

  if (error) {
    return { error: "No se pudo actualizar el estado." };
  }

  revalidatePath(`/tareas/${tareaId}`);
  revalidatePath("/tareas");
  return { error: null };
}

export async function agregarComentario(
  tareaId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    return { error: "No autenticado." };
  }

  const comentario = ((formData.get("comentario") as string) ?? "").trim();
  if (!comentario) {
    return { error: "El comentario no puede estar vacío." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("tarea_comentarios").insert({
    tarea_id: tareaId,
    autor_id: profile.id,
    comentario,
  });

  if (error) {
    return { error: "No se pudo guardar el comentario." };
  }

  revalidatePath(`/tareas/${tareaId}`);
  return { error: null };
}
