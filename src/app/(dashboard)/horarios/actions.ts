"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import type { EstadoTurno } from "@/types";

export interface FormState {
  error: string | null;
}

function leerCamposTurno(formData: FormData) {
  const fecha = (formData.get("fecha") as string) ?? "";
  const grupo_id = (formData.get("grupo_id") as string) || "";
  const grupo_horario_id = (formData.get("grupo_horario_id") as string) || "";
  const profesor_id = (formData.get("profesor_id") as string) || null;

  return { fecha, grupo_id, grupo_horario_id, profesor_id };
}

function validarCamposTurno({
  fecha,
  grupo_id,
  grupo_horario_id,
}: ReturnType<typeof leerCamposTurno>): string | null {
  if (!fecha || !grupo_id || !grupo_horario_id) {
    return "Completá fecha, grupo y horario.";
  }
  return null;
}

/**
 * El horario ya no se tipea a mano: se deriva del bloque elegido en
 * `grupo_horarios`. Se re-consulta acá (no se confía en lo que mandó el
 * formulario) para no depender de que el cliente no haya manipulado el
 * horario, y para chequear que el bloque realmente pertenezca al grupo
 * elegido.
 */
async function resolverHorarioDeGrupo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  grupo_id: string,
  grupo_horario_id: string
): Promise<{ hora_inicio: string; hora_fin: string } | null> {
  const { data: bloque } = await supabase
    .from("grupo_horarios")
    .select("hora_inicio, hora_fin, grupo_id")
    .eq("id", grupo_horario_id)
    .single();

  if (!bloque || bloque.grupo_id !== grupo_id) {
    return null;
  }

  return { hora_inicio: bloque.hora_inicio, hora_fin: bloque.hora_fin };
}

export async function crearTurno(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.rol === "Empleado" || profile.rol === "Patinador") {
    return { error: "No tenés permiso para crear turnos." };
  }

  const campos = leerCamposTurno(formData);
  const errorValidacion = validarCamposTurno(campos);
  if (errorValidacion) {
    return { error: errorValidacion };
  }

  const { fecha, grupo_id, grupo_horario_id, profesor_id } = campos;
  const profesorFinal = profile.rol === "Profesor" ? profile.id : profesor_id;

  const supabase = await createClient();

  const horario = await resolverHorarioDeGrupo(supabase, grupo_id, grupo_horario_id);
  if (!horario) {
    return { error: "El horario elegido no corresponde al grupo seleccionado." };
  }

  const { data: turno, error } = await supabase
    .from("turnos")
    .insert({
      fecha,
      hora_inicio: horario.hora_inicio,
      hora_fin: horario.hora_fin,
      grupo_id,
      profesor_id: profesorFinal,
    })
    .select("id")
    .single();

  if (error || !turno) {
    return { error: "No se pudo crear el turno." };
  }

  revalidatePath("/horarios");
  redirect(`/horarios/${turno.id}`);
}

export async function editarTurno(
  turnoId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.rol === "Empleado" || profile.rol === "Patinador") {
    return { error: "No tenés permiso para editar este turno." };
  }

  const campos = leerCamposTurno(formData);
  const errorValidacion = validarCamposTurno(campos);
  if (errorValidacion) {
    return { error: errorValidacion };
  }

  const { fecha, grupo_id, grupo_horario_id, profesor_id } = campos;

  const supabase = await createClient();

  const horario = await resolverHorarioDeGrupo(supabase, grupo_id, grupo_horario_id);
  if (!horario) {
    return { error: "El horario elegido no corresponde al grupo seleccionado." };
  }

  const update: Record<string, unknown> = {
    fecha,
    hora_inicio: horario.hora_inicio,
    hora_fin: horario.hora_fin,
    grupo_id,
  };
  // Un Profesor no puede reasignar el turno a otro profesor (RLS lo rechazaría
  // de todos modos); Admin y Head Coach sí pueden tocar profesor_id.
  if (profile.rol === "Admin" || profile.rol === "Head Coach") {
    update.profesor_id = profesor_id;
  }

  const { error } = await supabase.from("turnos").update(update).eq("id", turnoId);

  if (error) {
    return { error: "No se pudo actualizar el turno." };
  }

  revalidatePath(`/horarios/${turnoId}`);
  revalidatePath("/horarios");
  redirect(`/horarios/${turnoId}`);
}

export async function actualizarEstadoTurno(
  turnoId: string,
  estado: EstadoTurno
): Promise<FormState> {
  const supabase = await createClient();

  const { error } = await supabase.from("turnos").update({ estado }).eq("id", turnoId);

  if (error) {
    return { error: "No se pudo actualizar el estado del turno." };
  }

  revalidatePath(`/horarios/${turnoId}`);
  revalidatePath("/horarios");
  return { error: null };
}

export async function agregarComentarioTurno(
  turnoId: string,
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

  const { error } = await supabase.from("turno_comentarios").insert({
    turno_id: turnoId,
    autor_id: profile.id,
    comentario,
  });

  if (error) {
    return { error: "No se pudo guardar el comentario." };
  }

  revalidatePath(`/horarios/${turnoId}`);
  return { error: null };
}

export async function borrarTurno(turnoId: string): Promise<FormState> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.rol !== "Admin") {
    return { error: "Solo un Admin puede borrar turnos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("turnos").delete().eq("id", turnoId);

  if (error) {
    return { error: "No se pudo borrar el turno." };
  }

  revalidatePath("/horarios");
  redirect("/horarios");
}
