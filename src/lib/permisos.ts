import type { Rol, User } from "@/types";

interface TareaPermisos {
  created_by: string;
  tarea_asignados?: { usuario_id: string }[] | null;
}

type PerfilPermisos = Pick<User, "id" | "rol">;

function esResponsable(profile: PerfilPermisos, tarea: TareaPermisos): boolean {
  return (tarea.tarea_asignados ?? []).some((a) => a.usuario_id === profile.id);
}

export function puedeVerModuloTareas(rol: Rol | undefined | null): boolean {
  return !!rol && rol !== "Patinador";
}

export function puedeVerModuloMiembros(rol: Rol | undefined | null): boolean {
  return !!rol && rol !== "Patinador";
}

export function puedeVerEmailsMiembros(rol: Rol | undefined | null): boolean {
  return rol === "Admin" || rol === "Head Coach" || rol === "Secretaria";
}

export function puedeCrearTarea(rol: Rol | undefined | null): boolean {
  return rol === "Admin" || rol === "Profesor" || rol === "Head Coach" || rol === "Secretaria";
}

export function puedeEditarTarea(profile: PerfilPermisos | null, tarea: TareaPermisos): boolean {
  if (!profile) return false;
  if (profile.rol === "Admin") return true;
  if (profile.rol === "Profesor" || profile.rol === "Head Coach" || profile.rol === "Secretaria") {
    return tarea.created_by === profile.id || esResponsable(profile, tarea);
  }
  return false;
}

export function puedeCambiarEstadoTarea(
  profile: PerfilPermisos | null,
  tarea: TareaPermisos
): boolean {
  if (!profile) return false;
  if (profile.rol === "Admin" || profile.rol === "Head Coach" || profile.rol === "Secretaria") {
    return true;
  }
  if (profile.rol === "Profesor" || profile.rol === "Empleado") {
    return esResponsable(profile, tarea);
  }
  return false;
}

export function puedeVerRecaudacion(rol: Rol | undefined | null): boolean {
  return rol === "Admin" || rol === "Head Coach";
}
