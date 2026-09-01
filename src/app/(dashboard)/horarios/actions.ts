"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { resolverHorarioPorDia } from "@/lib/horarios/resolver-horario";
import { sincronizarProfesores } from "@/lib/horarios/sync-profesores";
import { diaIsoDeFecha } from "@/lib/utils/date";
import type { EstadoTurno, TipoTurno } from "@/types";

const TIPOS_VALIDOS: TipoTurno[] = ["Patín", "Preparación física"];

export interface FormState {
  error: string | null;
}

function leerCamposTurno(formData: FormData) {
  const fecha = (formData.get("fecha") as string) ?? "";
  const grupo_id = (formData.get("grupo_id") as string) || "";
  const profesores = formData.getAll("profesores") as string[];
  const tipoRaw = (formData.get("tipo") as string) || "Patín";
  const tipo: TipoTurno = TIPOS_VALIDOS.includes(tipoRaw as TipoTurno)
    ? (tipoRaw as TipoTurno)
    : "Patín";
  const planificacionRaw = ((formData.get("planificacion") as string) ?? "").trim();
  const planificacion = planificacionRaw.length > 0 ? planificacionRaw : null;

  return { fecha, grupo_id, profesores, tipo, planificacion };
}

function validarCamposTurno({
  fecha,
  grupo_id,
}: ReturnType<typeof leerCamposTurno>): string | null {
  if (!fecha || !grupo_id) {
    return "Completá fecha y grupo.";
  }
  return null;
}

export async function editarTurno(
  turnoId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.rol === "Empleado" || profile.rol === "Patinador") {
    return { error: "No tenés permiso para editar esta clase." };
  }

  const campos = leerCamposTurno(formData);
  const errorValidacion = validarCamposTurno(campos);
  if (errorValidacion) {
    return { error: errorValidacion };
  }

  const { fecha, grupo_id, profesores, tipo, planificacion } = campos;

  const supabase = await createClient();

  const horario = await resolverHorarioPorDia(supabase, grupo_id, diaIsoDeFecha(fecha));
  if (!horario) {
    return { error: "Ese grupo no tiene clase ese día de la semana." };
  }

  const { error } = await supabase
    .from("turnos")
    .update({
      fecha,
      hora_inicio: horario.hora_inicio,
      hora_fin: horario.hora_fin,
      grupo_id,
      tipo,
      planificacion,
    })
    .eq("id", turnoId);

  if (error) {
    return { error: "No se pudo actualizar la clase." };
  }

  // Un Profesor no puede reasignar los profesores de la clase (RLS lo
  // rechazaría de todos modos, y el form no le muestra el checklist);
  // solo Admin y Head Coach tocan la lista de profesores asignados.
  if (profile.rol === "Admin" || profile.rol === "Head Coach") {
    const { error: profesoresError } = await sincronizarProfesores(supabase, turnoId, profesores);
    if (profesoresError) {
      return { error: profesoresError };
    }
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
    return { error: "No se pudo actualizar el estado de la clase." };
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
    return { error: "Solo un Admin puede borrar clases." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("turnos").delete().eq("id", turnoId);

  if (error) {
    return { error: "No se pudo borrar la clase." };
  }

  revalidatePath("/horarios");
  redirect("/horarios");
}
