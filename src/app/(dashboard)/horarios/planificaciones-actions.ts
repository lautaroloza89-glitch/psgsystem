"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeCargarPlanificaciones } from "@/lib/permisos";
import { resolverHorarioPorDia } from "@/lib/horarios/resolver-horario";
import { sincronizarProfesores } from "@/lib/horarios/sync-profesores";
import { diaIsoDeFecha } from "@/lib/utils/date";
import type { TipoTurno } from "@/types";
import type { FormState } from "./actions";

const TIPOS_VALIDOS: TipoTurno[] = ["Patín", "Preparación física"];

/**
 * Crea o actualiza la fila de `turnos` de una fecha puntual con el
 * contenido de la planificación y sincroniza sus profesores asignados. Si
 * ya existe una clase para ese grupo+fecha, solo se tocan
 * `tipo`/`planificacion`/profesores (no el horario). Si no existe, se crea
 * derivando el horario de `grupo_horarios` según el día de la semana.
 */
async function upsertPlanificacionFecha(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    grupo_id: string;
    fecha: string;
    tipo: TipoTurno;
    planificacion: string;
    profesoresFinal: string[];
  }
): Promise<{ error: string | null }> {
  const { grupo_id, fecha, tipo, planificacion, profesoresFinal } = params;

  const { data: existente } = await supabase
    .from("turnos")
    .select("id")
    .eq("grupo_id", grupo_id)
    .eq("fecha", fecha)
    // Sin `tipo` acá, cargar la Preparación física de un grupo pisaba la
    // planificación de Patín de esa misma fecha y la primera se perdía de la
    // base. Un grupo como Avanzado entrena 19:30-22:00 con la media hora
    // inicial de física: es una sola clase real y un solo horario, pero son
    // dos contenidos distintos, y por eso son dos filas de `turnos`.
    .eq("tipo", tipo)
    .maybeSingle();

  let turnoId = existente?.id as string | undefined;

  if (turnoId) {
    const { error } = await supabase
      .from("turnos")
      .update({ tipo, planificacion })
      .eq("id", turnoId);
    if (error) {
      return { error: "No se pudo actualizar la planificación." };
    }
  } else {
    const horario = await resolverHorarioPorDia(supabase, grupo_id, diaIsoDeFecha(fecha));
    if (!horario) {
      return { error: `El grupo no tiene horario configurado para el ${fecha}.` };
    }

    const { data: nuevo, error } = await supabase
      .from("turnos")
      .insert({
        fecha,
        grupo_id,
        hora_inicio: horario.hora_inicio,
        hora_fin: horario.hora_fin,
        tipo,
        planificacion,
      })
      .select("id")
      .single();

    if (error || !nuevo) {
      return { error: "No se pudo crear la clase para esa fecha." };
    }
    turnoId = nuevo.id;
  }

  const { error: profesoresError } = await sincronizarProfesores(
    supabase,
    turnoId!,
    profesoresFinal
  );
  return { error: profesoresError };
}

/**
 * Carga de planificación con selección de fechas (F2 MOD 1, punto 4): el
 * mismo contenido y los mismos profesores se aplican a todas las fechas
 * tildadas del mes que caen en el día de semana elegido. Única forma de
 * crear una planificación (Parche "unificar creación de planificaciones") —
 * no existe más un formulario de "Nueva clase" aparte.
 */
export async function guardarPlanificacion(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await getCurrentUserProfile();
  if (!puedeCargarPlanificaciones(profile)) {
    return { error: "No tenés permiso para cargar planificaciones." };
  }

  // El grupo viaja en el formulario y ya no en el bind de la action: desde la
  // pestaña «Por grupo» se entra a cargar sin haber elegido ninguno todavía,
  // y se elige adentro con los mismos chips que usa «Editar clase».
  const grupoId = (formData.get("grupo_id") as string) || "";
  if (!grupoId) {
    return { error: "Elegí un grupo." };
  }

  const fechas = formData.getAll("fechas") as string[];
  const tipoRaw = (formData.get("tipo") as string) || "Patín";
  const tipo: TipoTurno = TIPOS_VALIDOS.includes(tipoRaw as TipoTurno)
    ? (tipoRaw as TipoTurno)
    : "Patín";
  const planificacion = ((formData.get("planificacion") as string) ?? "").trim();
  const mes = (formData.get("mes") as string) || "";
  const profesores = formData.getAll("profesores") as string[];
  // Un Profesor no ve el checklist (no lo elige en el form): siempre queda
  // autoasignado. Admin/Head Coach eligen libremente quién dicta la clase.
  const profesoresFinal = profile.rol === "Profesor" ? [profile.id] : profesores;

  if (fechas.length === 0) {
    return { error: "Elegí al menos una fecha." };
  }
  if (!planificacion) {
    return { error: "La planificación no puede estar vacía." };
  }

  const supabase = await createClient();

  for (const fecha of fechas) {
    const { error } = await upsertPlanificacionFecha(supabase, {
      grupo_id: grupoId,
      fecha,
      tipo,
      planificacion,
      profesoresFinal,
    });
    if (error) {
      return { error };
    }
  }

  revalidatePath(`/horarios/grupos/${grupoId}`);
  revalidatePath("/horarios");
  redirect(`/horarios/grupos/${grupoId}${mes ? `?mes=${mes}` : ""}`);
}

/** Duplicar planificación (F2 MOD 1, punto 7): mismo contenido, otra fecha, sin tocar profesores. */
export async function duplicarPlanificacion(
  turnoIdOrigen: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await getCurrentUserProfile();
  if (!puedeCargarPlanificaciones(profile)) {
    return { error: "No tenés permiso para duplicar planificaciones." };
  }

  const fecha = (formData.get("fecha") as string) ?? "";
  const tipoRaw = (formData.get("tipo") as string) || "Patín";
  const tipo: TipoTurno = TIPOS_VALIDOS.includes(tipoRaw as TipoTurno)
    ? (tipoRaw as TipoTurno)
    : "Patín";
  const planificacion = ((formData.get("planificacion") as string) ?? "").trim();

  if (!fecha) {
    return { error: "Elegí una fecha." };
  }
  if (!planificacion) {
    return { error: "La planificación no puede estar vacía." };
  }

  const supabase = await createClient();

  const { data: origen } = await supabase
    .from("turnos")
    .select("grupo_id, profesores:turno_profesores(profesor_id)")
    .eq("id", turnoIdOrigen)
    .single();

  if (!origen?.grupo_id) {
    return { error: "No se encontró el grupo de la clase original." };
  }

  const profesoresOrigen = (origen.profesores as unknown as { profesor_id: string }[]).map(
    (p) => p.profesor_id
  );

  const { error } = await upsertPlanificacionFecha(supabase, {
    grupo_id: origen.grupo_id,
    fecha,
    tipo,
    planificacion,
    profesoresFinal: profesoresOrigen,
  });
  if (error) {
    return { error };
  }

  const { data: destino } = await supabase
    .from("turnos")
    .select("id")
    .eq("grupo_id", origen.grupo_id)
    .eq("fecha", fecha)
    // Misma razón: ahora una fecha puede tener Patín y Preparación física, y
    // sin filtrar por tipo este `single()` fallaría con las dos cargadas,
    // mandando el redirect al fallback en vez de a la clase recién creada.
    .eq("tipo", tipo)
    .single();

  revalidatePath(`/horarios/grupos/${origen.grupo_id}`);
  revalidatePath("/horarios");
  redirect(destino ? `/horarios/${destino.id}` : "/horarios");
}

/** "Objetivo del mes" por grupo (F2 MOD 1, punto 6). Upsert por grupo+mes. */
export async function guardarObjetivoMes(
  grupoId: string,
  mes: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await getCurrentUserProfile();
  if (!puedeCargarPlanificaciones(profile)) {
    return { error: "No tenés permiso para editar el objetivo del mes." };
  }

  const objetivo = ((formData.get("objetivo") as string) ?? "").trim();
  if (!objetivo) {
    return { error: "El objetivo no puede estar vacío." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("grupo_objetivos_mes")
    .upsert(
      { grupo_id: grupoId, mes, objetivo },
      { onConflict: "grupo_id,mes" }
    );

  if (error) {
    return { error: "No se pudo guardar el objetivo del mes." };
  }

  revalidatePath(`/horarios/grupos/${grupoId}`);
  return { error: null };
}
