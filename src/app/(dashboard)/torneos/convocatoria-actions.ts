"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeGestionarConvocatoria } from "@/lib/permisos";
import type { EstadoInscripcion } from "@/types";
import type { FormState } from "./actions";

const ESTADOS: EstadoInscripcion[] = ["Pendiente", "Paga", "Exenta"];

/**
 * Escribir la convocatoria de un torneo: Admin, Head Coach y **Secretaria**,
 * mismo trío que la RLS de `torneo_participantes`.
 *
 * El modelo `Th` decía que convocar era solo Admin/Head Coach por ser una
 * decisión deportiva, pero eso quedó sin efecto antes de este módulo: en la
 * práctica la lista la arma Dai, y dejarla pudiendo marcar quién pagó pero no
 * agregar a nadie la obligaba a depender de otra persona para empezar. Ver
 * «El calendario de torneos y la convocatoria tienen dueños distintos» en
 * `docs/decisiones.md`.
 */
function revalidarTorneo(torneoId: string) {
  revalidatePath(`/torneos/${torneoId}`);
  revalidatePath(`/torneos/${torneoId}/convocadas`);
  revalidatePath(`/torneos/${torneoId}/convocar`);
}

/** Suma alumnas a la lista. Se puede volver a entrar y agregar más. */
export async function convocarAlumnas(
  torneoId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await getCurrentUserProfile();
  if (!puedeGestionarConvocatoria(profile)) {
    return { error: "No tenés permiso para convocar alumnas." };
  }

  const alumnas = formData.getAll("alumnas") as string[];
  if (alumnas.length === 0) {
    return { error: "Elegí al menos una alumna." };
  }

  const supabase = await createClient();

  // El monto de la inscripción se precarga del torneo y después se puede pisar
  // por alumna: a veces una paga distinto (media beca, categoría doble).
  const { data: torneo } = await supabase
    .from("torneos")
    .select("inscripcion_monto")
    .eq("id", torneoId)
    .single();

  // Quien ya está en la lista se ignora en vez de romper el insert entero por
  // el unique (torneo_id, alumna_id): el listado se puede haber quedado viejo
  // si alguien convocó desde otro teléfono mientras tanto.
  const { data: yaEstan } = await supabase
    .from("torneo_participantes")
    .select("alumna_id")
    .eq("torneo_id", torneoId);

  const existentes = new Set((yaEstan ?? []).map((p) => p.alumna_id));
  const nuevas = alumnas.filter((id) => !existentes.has(id));

  if (nuevas.length === 0) {
    return { error: "Esas alumnas ya estaban convocadas." };
  }

  const { error } = await supabase.from("torneo_participantes").insert(
    nuevas.map((alumnaId) => ({
      torneo_id: torneoId,
      alumna_id: alumnaId,
      inscripcion_monto: torneo?.inscripcion_monto ?? null,
      convocada_por: profile.id,
    }))
  );

  if (error) {
    return { error: "No se pudieron convocar las alumnas." };
  }

  revalidarTorneo(torneoId);
  return { error: null };
}

/** Saca a una alumna del torneo. */
export async function quitarConvocada(
  torneoId: string,
  participanteId: string
): Promise<FormState> {
  const profile = await getCurrentUserProfile();
  if (!puedeGestionarConvocatoria(profile)) {
    return { error: "No tenés permiso para sacar alumnas de la lista." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("torneo_participantes")
    .delete()
    .eq("id", participanteId)
    .eq("torneo_id", torneoId);

  if (error) {
    return { error: "No se pudo sacar a la alumna del torneo." };
  }

  revalidarTorneo(torneoId);
  return { error: null };
}

/**
 * La categoría en la que compite: **texto libre**, sin enum ni validación.
 * Las categorías federativas son demasiadas y cambian por torneo y por
 * federación («C5 9», «PFM 12», «C5 13 FED»), así que la escribe quien arma la
 * lista y vive en esta convocatoria, no en la ficha de la alumna.
 */
export async function guardarCategoria(
  torneoId: string,
  participanteId: string,
  categoria: string
): Promise<FormState> {
  const profile = await getCurrentUserProfile();
  if (!puedeGestionarConvocatoria(profile)) {
    return { error: "No tenés permiso para editar la categoría." };
  }

  const limpia = categoria.trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("torneo_participantes")
    .update({ categoria: limpia || null })
    .eq("id", participanteId)
    .eq("torneo_id", torneoId);

  if (error) {
    return { error: "No se pudo guardar la categoría." };
  }

  revalidarTorneo(torneoId);
  return { error: null };
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

function montoValido(monto: number | null): boolean {
  return monto === null || (Number.isFinite(monto) && monto >= 0 && monto < 100_000_000);
}

/**
 * Guarda el monto que la lista venía **sugiriendo** para esta fila, solo si
 * la fila sigue sin monto propio. La sugerencia (el monto cargado a otra
 * alumna del mismo torneo) no se escribe sola: se confirma recién cuando se
 * actúa sobre la fila — se la marca paga o se le pone el recargo.
 */
async function guardarSugerenciaSiFalta(
  supabase: Supabase,
  torneoId: string,
  participanteId: string,
  montoSugerido: number | null
) {
  if (montoSugerido === null || !montoValido(montoSugerido)) return;
  await supabase
    .from("torneo_participantes")
    .update({ inscripcion_monto: montoSugerido })
    .eq("id", participanteId)
    .eq("torneo_id", torneoId)
    .is("inscripcion_monto", null);
}

/**
 * El monto de la inscripción de una alumna. Varía por torneo y a veces por
 * alumna (media beca, categoría doble), así que se escribe fila por fila,
 * igual que la categoría. `null` lo deja vacío.
 */
export async function guardarMontoInscripcion(
  torneoId: string,
  participanteId: string,
  monto: number | null
): Promise<FormState> {
  const profile = await getCurrentUserProfile();
  if (!puedeGestionarConvocatoria(profile)) {
    return { error: "No tenés permiso para editar el monto." };
  }
  if (!montoValido(monto)) {
    return { error: "El monto no es válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("torneo_participantes")
    .update({ inscripcion_monto: monto })
    .eq("id", participanteId)
    .eq("torneo_id", torneoId);

  if (error) {
    return { error: "No se pudo guardar el monto." };
  }

  revalidarTorneo(torneoId);
  return { error: null };
}

/**
 * Prende o apaga el recargo de una alumna. Igual que en cuotas, **no es
 * automático por fecha**: lo marca quien cobra, que es quien sabe si pagó
 * tarde. El valor es `RECARGO_MONTO`, el mismo de Pagos.
 */
export async function alternarRecargoInscripcion(
  torneoId: string,
  participanteId: string,
  aplicado: boolean,
  montoSugerido: number | null
): Promise<FormState> {
  const profile = await getCurrentUserProfile();
  if (!puedeGestionarConvocatoria(profile)) {
    return { error: "No tenés permiso para tocar el recargo." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("torneo_participantes")
    .update({ recargo_aplicado: aplicado })
    .eq("id", participanteId)
    .eq("torneo_id", torneoId);

  if (error) {
    return { error: "No se pudo guardar el recargo." };
  }

  if (aplicado) {
    await guardarSugerenciaSiFalta(supabase, torneoId, participanteId, montoSugerido);
  }

  revalidarTorneo(torneoId);
  return { error: null };
}

/**
 * El estado de la inscripción. **No toca `pagos`**: lo que la alumna paga para
 * competir se gira a la organización del torneo, no entra al club, así que no
 * puede sumar a la recaudación ni contarse contra la cuota del mes (decisión
 * de Lauti, 2026-09-09).
 *
 * Al marcarla paga, si la fila no tenía monto propio se guarda el que la lista
 * le sugería: una inscripción paga sin monto dejaría la planilla sin la cifra.
 */
export async function cambiarEstadoInscripcion(
  torneoId: string,
  participanteId: string,
  estado: string,
  montoSugerido: number | null = null
): Promise<FormState> {
  const profile = await getCurrentUserProfile();
  if (!puedeGestionarConvocatoria(profile)) {
    return { error: "No tenés permiso para tocar la inscripción." };
  }

  if (!ESTADOS.includes(estado as EstadoInscripcion)) {
    return { error: "Estado de inscripción inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("torneo_participantes")
    .update({ inscripcion_estado: estado })
    .eq("id", participanteId)
    .eq("torneo_id", torneoId);

  if (error) {
    return { error: "No se pudo actualizar la inscripción." };
  }

  if (estado === "Paga") {
    await guardarSugerenciaSiFalta(supabase, torneoId, participanteId, montoSugerido);
  }

  revalidarTorneo(torneoId);
  return { error: null };
}
