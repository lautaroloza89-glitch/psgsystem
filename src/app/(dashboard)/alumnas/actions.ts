"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import type { EstadoAlumna, Rol } from "@/types";

export interface FormState {
  error: string | null;
}

const ESTADOS_VALIDOS: EstadoAlumna[] = ["activa", "baja"];

function puedeGestionarAlumnas(rol: Rol | undefined): boolean {
  return rol === "Admin" || rol === "Head Coach" || rol === "Secretaria";
}

interface ContactoInput {
  id: string | null;
  nombre: string;
  telefono: string;
  relacion: string | null;
  es_pagador_principal: boolean;
}

function leerCamposAlumna(formData: FormData) {
  const apellido = ((formData.get("apellido") as string) ?? "").trim();
  const nombre = ((formData.get("nombre") as string) ?? "").trim();
  const dniRaw = ((formData.get("dni") as string) ?? "").trim();
  const dni = dniRaw.length > 0 ? dniRaw : null;
  const fecha_inscripcion = ((formData.get("fecha_inscripcion") as string) ?? "").trim();
  const grupo_id = ((formData.get("grupo_id") as string) ?? "").trim();

  return { apellido, nombre, dni, fecha_inscripcion, grupo_id };
}

function validarCamposAlumna({
  apellido,
  nombre,
  dni,
  grupo_id,
}: ReturnType<typeof leerCamposAlumna>): string | null {
  if (!apellido || !nombre) {
    return "Completá apellido y nombre.";
  }
  if (!grupo_id) {
    return "Elegí un grupo.";
  }
  if (dni && !/^\d{7,8}$/.test(dni)) {
    return "El DNI debe tener 7 u 8 dígitos.";
  }
  return null;
}

function leerContactos(formData: FormData): ContactoInput[] {
  const ids = formData.getAll("contacto_id") as string[];
  const nombres = formData.getAll("contacto_nombre") as string[];
  const telefonos = formData.getAll("contacto_telefono") as string[];
  const relaciones = formData.getAll("contacto_relacion") as string[];
  const pagadorIndex = parseInt((formData.get("pagador_principal_index") as string) ?? "-1", 10);

  const contactos: ContactoInput[] = [];
  for (let i = 0; i < nombres.length; i++) {
    const nombre = (nombres[i] ?? "").trim();
    const telefono = (telefonos[i] ?? "").trim();
    const relacionRaw = (relaciones[i] ?? "").trim();
    if (!nombre && !telefono) continue; // fila sin completar, se ignora

    contactos.push({
      id: ids[i] || null,
      nombre,
      telefono,
      relacion: relacionRaw.length > 0 ? relacionRaw : null,
      es_pagador_principal: i === pagadorIndex,
    });
  }
  return contactos;
}

function validarContactos(contactos: ContactoInput[]): string | null {
  for (const c of contactos) {
    if (!c.nombre || !c.telefono) {
      return "Completá nombre y teléfono en cada contacto agregado.";
    }
  }
  return null;
}

async function buscarAlumnaConDni(
  supabase: Awaited<ReturnType<typeof createClient>>,
  dni: string,
  excluirId?: string
) {
  let query = supabase.from("alumnas").select("apellido, nombre").eq("dni", dni);
  if (excluirId) {
    query = query.neq("id", excluirId);
  }
  const { data } = await query.maybeSingle();
  return data;
}

async function sincronizarContactos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  alumnaId: string,
  contactos: ContactoInput[]
): Promise<{ error: string | null }> {
  const { data: existentes } = await supabase
    .from("contactos")
    .select("id")
    .eq("alumna_id", alumnaId);

  const idsExistentes = (existentes ?? []).map((c) => c.id as string);
  const idsEnviados = new Set(contactos.filter((c) => c.id).map((c) => c.id as string));
  const idsABorrar = idsExistentes.filter((id) => !idsEnviados.has(id));

  if (idsABorrar.length > 0) {
    const { error } = await supabase.from("contactos").delete().in("id", idsABorrar);
    if (error) return { error: "No se pudieron actualizar los contactos." };
  }

  const nuevos = contactos.filter((c) => !c.id);
  if (nuevos.length > 0) {
    const { error } = await supabase.from("contactos").insert(
      nuevos.map((c) => ({
        alumna_id: alumnaId,
        nombre: c.nombre,
        telefono: c.telefono,
        relacion: c.relacion,
        es_pagador_principal: c.es_pagador_principal,
      }))
    );
    if (error) return { error: "No se pudieron guardar los contactos nuevos." };
  }

  for (const c of contactos.filter((c) => c.id)) {
    const { error } = await supabase
      .from("contactos")
      .update({
        nombre: c.nombre,
        telefono: c.telefono,
        relacion: c.relacion,
        es_pagador_principal: c.es_pagador_principal,
      })
      .eq("id", c.id as string);
    if (error) return { error: "No se pudieron actualizar los contactos." };
  }

  return { error: null };
}

export async function crearAlumna(_prevState: FormState, formData: FormData): Promise<FormState> {
  const profile = await getCurrentUserProfile();
  if (!profile || !puedeGestionarAlumnas(profile.rol)) {
    return { error: "No tenés permiso para crear alumnas." };
  }

  const campos = leerCamposAlumna(formData);
  const errorCampos = validarCamposAlumna(campos);
  if (errorCampos) {
    return { error: errorCampos };
  }

  const contactos = leerContactos(formData);
  const errorContactos = validarContactos(contactos);
  if (errorContactos) {
    return { error: errorContactos };
  }

  const supabase = await createClient();

  if (campos.dni) {
    const existente = await buscarAlumnaConDni(supabase, campos.dni);
    if (existente) {
      return {
        error: `Ya existe una alumna con ese DNI: ${existente.apellido}, ${existente.nombre}`,
      };
    }
  }

  const { data: nuevaAlumna, error } = await supabase
    .from("alumnas")
    .insert({
      apellido: campos.apellido,
      nombre: campos.nombre,
      dni: campos.dni,
      fecha_inscripcion: campos.fecha_inscripcion || undefined,
      grupo_id: campos.grupo_id,
      estado: "activa",
    })
    .select("id")
    .single();

  if (error || !nuevaAlumna) {
    return { error: "No se pudo crear la alumna." };
  }

  if (contactos.length > 0) {
    const { error: contactosError } = await supabase.from("contactos").insert(
      contactos.map((c) => ({
        alumna_id: nuevaAlumna.id,
        nombre: c.nombre,
        telefono: c.telefono,
        relacion: c.relacion,
        es_pagador_principal: c.es_pagador_principal,
      }))
    );

    if (contactosError) {
      return { error: "La alumna se creó, pero no se pudieron guardar los contactos." };
    }
  }

  revalidatePath("/alumnas");
  redirect(`/alumnas/${nuevaAlumna.id}`);
}

export async function editarAlumna(
  alumnaId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await getCurrentUserProfile();
  if (!profile || !puedeGestionarAlumnas(profile.rol)) {
    return { error: "No tenés permiso para editar alumnas." };
  }

  const campos = leerCamposAlumna(formData);
  const errorCampos = validarCamposAlumna(campos);
  if (errorCampos) {
    return { error: errorCampos };
  }

  const estadoRaw = (formData.get("estado") as string) ?? "activa";
  const estado: EstadoAlumna = ESTADOS_VALIDOS.includes(estadoRaw as EstadoAlumna)
    ? (estadoRaw as EstadoAlumna)
    : "activa";

  const contactos = leerContactos(formData);
  const errorContactos = validarContactos(contactos);
  if (errorContactos) {
    return { error: errorContactos };
  }

  const supabase = await createClient();

  if (campos.dni) {
    const existente = await buscarAlumnaConDni(supabase, campos.dni, alumnaId);
    if (existente) {
      return {
        error: `Ya existe una alumna con ese DNI: ${existente.apellido}, ${existente.nombre}`,
      };
    }
  }

  const { error } = await supabase
    .from("alumnas")
    .update({
      apellido: campos.apellido,
      nombre: campos.nombre,
      dni: campos.dni,
      fecha_inscripcion: campos.fecha_inscripcion || undefined,
      grupo_id: campos.grupo_id,
      estado,
    })
    .eq("id", alumnaId);

  if (error) {
    return { error: "No se pudo actualizar la alumna." };
  }

  const { error: contactosError } = await sincronizarContactos(supabase, alumnaId, contactos);
  if (contactosError) {
    return { error: contactosError };
  }

  revalidatePath(`/alumnas/${alumnaId}`);
  revalidatePath("/alumnas");
  redirect(`/alumnas/${alumnaId}`);
}
