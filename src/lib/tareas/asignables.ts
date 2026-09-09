import type { createClient } from "@/lib/supabase/server";
import type { User } from "@/types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type PersonaAsignable = Pick<User, "id" | "nombre" | "rol" | "cargo">;

/**
 * Quién puede ser responsable de una tarea: **el equipo de trabajo del club**.
 *
 * Quedan afuera dos roles, por motivos distintos:
 * - **Patinador**: una tarea no se le asigna a una alumna con login.
 * - **Admin**: es el usuario de quien construye y administra el sistema, no
 *   alguien que trabaja en el club (decisión de Lauti, 2026-09-09). Sigue
 *   creando, editando y cerrando tareas de los demás — lo que no puede es
 *   ser el responsable de una.
 *
 * También quedan afuera las personas dadas de baja (`users.estado`).
 */
export async function leerPersonalAsignable(supabase: Supabase): Promise<PersonaAsignable[]> {
  const { data } = await supabase
    .from("users")
    .select("id, nombre, rol, cargo")
    .eq("estado", "activo")
    // Dos `neq` encadenados en vez de un `not in`: es la forma que ya usaba
    // este selector y no depende de cómo se escriben las listas en PostgREST.
    .neq("rol", "Patinador")
    .neq("rol", "Admin")
    .order("nombre");

  return (data ?? []) as PersonaAsignable[];
}

/**
 * Lo mismo, pero sin perder a quien ya estaba asignado.
 *
 * Al editar una tarea vieja, alguien que hoy no sería asignable (un Admin de
 * antes de esta regla, o alguien dado de baja después) tiene que seguir
 * apareciendo tildado: el guardado sincroniza contra lo que manda el
 * formulario, así que un responsable que no está en la lista se borraría solo
 * al guardar cualquier otro cambio.
 */
export async function leerPersonalAsignableConActuales(
  supabase: Supabase,
  idsActuales: string[]
): Promise<PersonaAsignable[]> {
  const asignables = await leerPersonalAsignable(supabase);
  const yaEstan = new Set(asignables.map((p) => p.id));
  const faltantes = idsActuales.filter((id) => !yaEstan.has(id));

  if (faltantes.length === 0) return asignables;

  const { data } = await supabase
    .from("users")
    .select("id, nombre, rol, cargo")
    .in("id", faltantes);

  return [...asignables, ...((data ?? []) as PersonaAsignable[])].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es")
  );
}
