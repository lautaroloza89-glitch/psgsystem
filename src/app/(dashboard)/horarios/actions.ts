"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import type { EstadoTurno, TipoTurno } from "@/types";

const TIPOS_VALIDOS: TipoTurno[] = ["Patín", "Preparación física"];

export interface FormState {
  error: string | null;
}

function leerCamposTurno(formData: FormData) {
  const fecha = (formData.get("fecha") as string) ?? "";
  const grupo_id = (formData.get("grupo_id") as string) || "";
  const grupo_horario_id = (formData.get("grupo_horario_id") as string) || "";
  const profesores = formData.getAll("profesores") as string[];
  const tipoRaw = (formData.get("tipo") as string) || "Patín";
  const tipo: TipoTurno = TIPOS_VALIDOS.includes(tipoRaw as TipoTurno)
    ? (tipoRaw as TipoTurno)
    : "Patín";
  const planificacionRaw = ((formData.get("planificacion") as string) ?? "").trim();
  const planificacion = planificacionRaw.length > 0 ? planificacionRaw : null;

  return { fecha, grupo_id, grupo_horario_id, profesores, tipo, planificacion };
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
    return { error: "No tenés permiso para crear clases." };
  }

  const campos = leerCamposTurno(formData);
  const errorValidacion = validarCamposTurno(campos);
  if (errorValidacion) {
    return { error: errorValidacion };
  }

  const { fecha, grupo_id, grupo_horario_id, profesores, tipo, planificacion } = campos;
  // Un Profesor no elige el checklist (no lo ve en el form): siempre queda
  // autoasignado. Admin/Head Coach eligen libremente quién dicta la clase.
  const profesoresFinal = profile.rol === "Profesor" ? [profile.id] : profesores;

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
      tipo,
      planificacion,
    })
    .select("id")
    .single();

  if (error || !turno) {
    return { error: "No se pudo crear la clase." };
  }

  if (profesoresFinal.length > 0) {
    const { error: profesoresError } = await supabase
      .from("turno_profesores")
      .insert(profesoresFinal.map((profesor_id) => ({ turno_id: turno.id, profesor_id })));

    if (profesoresError) {
      return { error: "La clase se creó, pero no se pudieron asignar los profesores." };
    }
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
    return { error: "No tenés permiso para editar esta clase." };
  }

  const campos = leerCamposTurno(formData);
  const errorValidacion = validarCamposTurno(campos);
  if (errorValidacion) {
    return { error: errorValidacion };
  }

  const { fecha, grupo_id, grupo_horario_id, profesores, tipo, planificacion } = campos;

  const supabase = await createClient();

  const horario = await resolverHorarioDeGrupo(supabase, grupo_id, grupo_horario_id);
  if (!horario) {
    return { error: "El horario elegido no corresponde al grupo seleccionado." };
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
    // Diff contra los profesores actuales en vez de borrar todo y
    // reinsertar todo: así el trigger de notificaciones solo ve un INSERT
    // real para los profesores nuevos, y no reenvía notificación a quien
    // ya estaba asignado desde antes de esta edición.
    const { data: actuales, error: actualesError } = await supabase
      .from("turno_profesores")
      .select("profesor_id")
      .eq("turno_id", turnoId);

    if (actualesError) {
      return { error: "No se pudieron actualizar los profesores." };
    }

    const idsActuales = new Set((actuales ?? []).map((a) => a.profesor_id));
    const idsNuevos = new Set(profesores);
    const aQuitar = [...idsActuales].filter((id) => !idsNuevos.has(id));
    const aAgregar = [...idsNuevos].filter((id) => !idsActuales.has(id));

    if (aQuitar.length > 0) {
      const { error: deleteError } = await supabase
        .from("turno_profesores")
        .delete()
        .eq("turno_id", turnoId)
        .in("profesor_id", aQuitar);

      if (deleteError) {
        return { error: "No se pudieron actualizar los profesores." };
      }
    }

    if (aAgregar.length > 0) {
      const { error: insertError } = await supabase
        .from("turno_profesores")
        .insert(aAgregar.map((profesor_id) => ({ turno_id: turnoId, profesor_id })));

      if (insertError) {
        return { error: "No se pudieron actualizar los profesores." };
      }
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
