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

/**
 * Editar una tarea: Admin, Head Coach y Secretaria pueden con **cualquiera**;
 * Profesor solo con las que creó o tiene asignadas.
 *
 * Head Coach se amplió el 2026-09-08 (migración
 * `20260908160000_head_coach_ve_y_edita_todas_las_tareas`): es la dueña del
 * club, y el recorte venía de la Fase 1, cuando el rol se pensó como "Profesor
 * con más alcance sobre horarios". La RLS acompaña, y también se le abrió la
 * lectura: no se puede editar lo que no aparece en ningún listado.
 *
 * Borrar sigue siendo otra cosa — Admin, o quien la creó (`tareas_delete`).
 */
export function puedeEditarTarea(profile: PerfilPermisos | null, tarea: TareaPermisos): boolean {
  if (!profile) return false;
  if (profile.rol === "Admin" || profile.rol === "Head Coach" || profile.rol === "Secretaria") {
    return true;
  }
  if (profile.rol === "Profesor") {
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

/** Módulo de Pagos: entrar, registrar un pago y marcarlo verificado. */
export function puedeGestionarPagos(rol: Rol | undefined | null): boolean {
  return rol === "Admin" || rol === "Head Coach" || rol === "Secretaria";
}

/**
 * Anular un pago con motivo — la única corrección posible: un pago no se edita
 * ni se borra, se anula y se vuelve a cargar el correcto. Hoy coincide con
 * `puedeGestionarPagos`, pero va aparte por ser una transición destructiva:
 * si algún día se acota, se acota acá y no hay que buscarla.
 */
export function puedeAnularPago(rol: Rol | undefined | null): boolean {
  return rol === "Admin" || rol === "Head Coach" || rol === "Secretaria";
}

/** La recaudación total del club es la excepción de Pagos: Secretaria no la ve. */
export function puedeVerRecaudacion(rol: Rol | undefined | null): boolean {
  return rol === "Admin" || rol === "Head Coach";
}

export function puedeVerContadoresDashboard(rol: Rol | undefined | null): boolean {
  return rol === "Admin" || rol === "Head Coach" || rol === "Secretaria";
}
