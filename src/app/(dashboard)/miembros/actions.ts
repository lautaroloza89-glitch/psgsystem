"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeGestionarEquipo } from "@/lib/permisos";
import type { Rol } from "@/types";

export interface ResultadoMiembro {
  error?: string;
}

const ROLES: Rol[] = ["Admin", "Head Coach", "Secretaria", "Profesor", "Empleado", "Patinador"];

/**
 * Todo lo que hasta ahora se cambiaba a mano en la base: rol, cargo, quién
 * dicta clases y la baja del personal.
 *
 * Solo Admin, igual que la policy `users_update_admin` — la RLS sigue siendo
 * la que manda, esto es la segunda capa.
 */

export async function cambiarRol(usuarioId: string, rol: string): Promise<ResultadoMiembro> {
  const profile = await getCurrentUserProfile();
  if (!puedeGestionarEquipo(profile)) {
    return { error: "No tenés permiso para cambiar roles." };
  }

  if (!ROLES.includes(rol as Rol)) {
    return { error: "Ese rol no existe." };
  }

  // Un Admin no se cambia el rol a sí mismo: si es el único, el club se queda
  // sin nadie que pueda gestionar el equipo y hay que arreglarlo por SQL.
  if (usuarioId === profile.id) {
    return { error: "No podés cambiar tu propio rol. Pedíselo a otro Admin." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("users").update({ rol }).eq("id", usuarioId);
  if (error) return { error: "No se pudo cambiar el rol." };

  revalidatePath("/miembros");
  revalidatePath(`/miembros/${usuarioId}`);
  return {};
}

export async function cambiarCargo(usuarioId: string, cargo: string): Promise<ResultadoMiembro> {
  const profile = await getCurrentUserProfile();
  if (!puedeGestionarEquipo(profile)) {
    return { error: "No tenés permiso para cambiar cargos." };
  }

  const limpio = cargo.trim();
  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    // Vacío guarda `null`, no cadena vacía: «sin cargo» es la ausencia del
    // dato, y así el subtítulo puede caer en «da clases».
    .update({ cargo: limpio === "" ? null : limpio })
    .eq("id", usuarioId);
  if (error) return { error: "No se pudo guardar el cargo." };

  revalidatePath("/miembros");
  revalidatePath(`/miembros/${usuarioId}`);
  return {};
}

export async function cambiarDictaClases(
  usuarioId: string,
  dictaClases: boolean
): Promise<ResultadoMiembro> {
  const profile = await getCurrentUserProfile();
  if (!puedeGestionarEquipo(profile)) {
    return { error: "No tenés permiso para cambiar esto." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ dicta_clases: dictaClases })
    .eq("id", usuarioId);
  if (error) return { error: "No se pudo guardar el cambio." };

  revalidatePath("/miembros");
  revalidatePath(`/miembros/${usuarioId}`);
  return {};
}

/**
 * Baja lógica: la persona deja de figurar en listados y selectores, pero sus
 * tareas, sus turnos y los pagos que registró siguen ahí con su nombre.
 */
export async function darDeBaja(usuarioId: string): Promise<ResultadoMiembro> {
  const profile = await getCurrentUserProfile();
  if (!puedeGestionarEquipo(profile)) {
    return { error: "No tenés permiso para dar de baja a alguien." };
  }

  if (usuarioId === profile.id) {
    return { error: "No podés darte de baja a vos mismo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("users").update({ estado: "baja" }).eq("id", usuarioId);
  if (error) return { error: "No se pudo dar de baja." };

  revalidatePath("/miembros");
  return {};
}
