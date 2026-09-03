"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeGestionarTorneos } from "@/lib/torneos/permisos";
import type { TipoTorneo } from "@/types";

const TIPOS_VALIDOS: TipoTorneo[] = ["torneo", "exhibicion", "evento"];

export interface FormState {
  error: string | null;
}

function leerCamposTorneo(formData: FormData) {
  const nombre = ((formData.get("nombre") as string) ?? "").trim();
  const tipoRaw = (formData.get("tipo") as string) || "torneo";
  const tipo: TipoTorneo = TIPOS_VALIDOS.includes(tipoRaw as TipoTorneo)
    ? (tipoRaw as TipoTorneo)
    : "torneo";
  const lugarRaw = ((formData.get("lugar") as string) ?? "").trim();
  const lugar = lugarRaw.length > 0 ? lugarRaw : null;
  const fecha_inicio = (formData.get("fecha_inicio") as string) ?? "";
  const fecha_fin = (formData.get("fecha_fin") as string) ?? "";
  const notasRaw = ((formData.get("notas") as string) ?? "").trim();
  const notas = notasRaw.length > 0 ? notasRaw : null;

  return { nombre, tipo, lugar, fecha_inicio, fecha_fin, notas };
}

function validarCamposTorneo({
  nombre,
  fecha_inicio,
  fecha_fin,
}: ReturnType<typeof leerCamposTorneo>): string | null {
  if (!nombre) {
    return "El nombre es obligatorio.";
  }
  if (!fecha_inicio || !fecha_fin) {
    return "Completá fecha de inicio y de fin.";
  }
  if (fecha_fin < fecha_inicio) {
    return "La fecha de fin no puede ser anterior a la de inicio.";
  }
  return null;
}

export async function crearTorneo(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await getCurrentUserProfile();
  if (!puedeGestionarTorneos(profile?.rol)) {
    return { error: "No tenés permiso para crear torneos." };
  }

  const campos = leerCamposTorneo(formData);
  const errorValidacion = validarCamposTorneo(campos);
  if (errorValidacion) {
    return { error: errorValidacion };
  }

  const supabase = await createClient();

  const { data: torneo, error } = await supabase
    .from("torneos")
    .insert(campos)
    .select("id")
    .single();

  if (error || !torneo) {
    return { error: "No se pudo crear el torneo." };
  }

  revalidatePath("/torneos");
  redirect(`/torneos/${torneo.id}`);
}

export async function editarTorneo(
  torneoId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await getCurrentUserProfile();
  if (!puedeGestionarTorneos(profile?.rol)) {
    return { error: "No tenés permiso para editar torneos." };
  }

  const campos = leerCamposTorneo(formData);
  const errorValidacion = validarCamposTorneo(campos);
  if (errorValidacion) {
    return { error: errorValidacion };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("torneos").update(campos).eq("id", torneoId);

  if (error) {
    return { error: "No se pudo actualizar el torneo." };
  }

  revalidatePath(`/torneos/${torneoId}`);
  revalidatePath("/torneos");
  redirect(`/torneos/${torneoId}`);
}

export async function borrarTorneo(torneoId: string): Promise<FormState> {
  const profile = await getCurrentUserProfile();
  if (!puedeGestionarTorneos(profile?.rol)) {
    return { error: "No tenés permiso para borrar torneos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("torneos").delete().eq("id", torneoId);

  if (error) {
    return { error: "No se pudo borrar el torneo." };
  }

  revalidatePath("/torneos");
  redirect("/torneos");
}
