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
  const hora_inicio = (formData.get("hora_inicio") as string) ?? "";
  const hora_fin = (formData.get("hora_fin") as string) ?? "";
  const grupo_nivel = ((formData.get("grupo_nivel") as string) ?? "").trim();
  const profesor_id = (formData.get("profesor_id") as string) || null;

  return { fecha, hora_inicio, hora_fin, grupo_nivel, profesor_id };
}

function validarCamposTurno({
  fecha,
  hora_inicio,
  hora_fin,
  grupo_nivel,
}: ReturnType<typeof leerCamposTurno>): string | null {
  if (!fecha || !hora_inicio || !hora_fin || !grupo_nivel) {
    return "Completá fecha, horario y grupo/nivel.";
  }
  if (hora_fin <= hora_inicio) {
    return "La hora de fin tiene que ser posterior a la de inicio.";
  }
  return null;
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

  const { fecha, hora_inicio, hora_fin, grupo_nivel, profesor_id } = campos;
  const profesorFinal =
    profile.rol === "Profesor" || profile.rol === "Head Coach" ? profile.id : profesor_id;

  const supabase = await createClient();
  const { data: turno, error } = await supabase
    .from("turnos")
    .insert({
      fecha,
      hora_inicio,
      hora_fin,
      grupo_nivel,
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

  const { fecha, hora_inicio, hora_fin, grupo_nivel, profesor_id } = campos;

  const update: Record<string, unknown> = {
    fecha,
    hora_inicio,
    hora_fin,
    grupo_nivel,
  };
  // Un Profesor no puede reasignar el turno a otro profesor (RLS lo rechazaría
  // de todos modos); solo Admin puede tocar profesor_id.
  if (profile.rol === "Admin") {
    update.profesor_id = profesor_id;
  }

  const supabase = await createClient();
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
