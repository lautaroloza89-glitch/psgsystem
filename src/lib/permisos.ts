import type { User } from "@/types";

interface TareaPermisos {
  created_by: string;
  tarea_asignados?: { usuario_id: string }[] | null;
}

type PerfilPermisos = Pick<User, "id" | "rol">;

/**
 * Todos los helpers de este archivo reciben el **perfil completo**, no el rol,
 * y son *type guards* (`profile is T`).
 *
 * El motivo es de TypeScript, no de permisos. Cuando el gate de una pantalla
 * estaba escrito literal (`if (!profile || profile.rol !== "Admin") redirect()`),
 * el compilador entendía que después del gate `profile` era no-nulo. Al
 * centralizar las reglas acá, un gate como `if (!puedeGestionarPagos(profile?.rol))`
 * dejó de estrechar el tipo, y cualquier uso posterior de `profile` rompía el
 * typecheck — obligando a sembrar `profile?.rol` y `profile!` por todos lados.
 *
 * Con la firma `profile is T`, el gate vuelve a estrechar y el resto de la
 * pantalla usa `profile.rol` sin `?.` ni `!`. El genérico (en vez de
 * `profile is PerfilPermisos`) es para que el tipo estrechado sea el que trajo
 * el llamador — normalmente `User` —, y no se pierdan los demás campos.
 *
 * Regla para el rediseño: **ningún `profile!` ni `as User`**. Si el compilador
 * se queja de null después de un gate, es que a ese helper le falta el guard.
 */

function tieneRol<T extends PerfilPermisos>(
  profile: T | null | undefined,
  roles: readonly User["rol"][]
): profile is T {
  return !!profile && roles.includes(profile.rol);
}

function esResponsable(profile: PerfilPermisos, tarea: TareaPermisos): boolean {
  return (tarea.tarea_asignados ?? []).some((a) => a.usuario_id === profile.id);
}

export function puedeVerModuloTareas<T extends PerfilPermisos>(
  profile: T | null | undefined
): profile is T {
  return !!profile && profile.rol !== "Patinador";
}

export function puedeVerModuloMiembros<T extends PerfilPermisos>(
  profile: T | null | undefined
): profile is T {
  return !!profile && profile.rol !== "Patinador";
}

export function puedeVerEmailsMiembros<T extends PerfilPermisos>(
  profile: T | null | undefined
): profile is T {
  return tieneRol(profile, ["Admin", "Head Coach", "Secretaria"]);
}

/**
 * La ficha de una persona del equipo (`/miembros/[id]`): el email, desde
 * cuándo está en el club y sus tareas asignadas. Profesor y Empleado se quedan
 * en el listado — para ellos el módulo es una guía de quién es quién, no la
 * administración del equipo.
 */
export function puedeVerFichaMiembro<T extends PerfilPermisos>(
  profile: T | null | undefined
): profile is T {
  return tieneRol(profile, ["Admin", "Head Coach", "Secretaria"]);
}

/**
 * Cambiar el rol o el cargo de alguien, marcar quién dicta clases y dar de
 * baja: **solo Admin**, igual que la policy `users_update_admin`. Head Coach y
 * Secretaria ven la ficha en lectura.
 */
export function puedeGestionarEquipo<T extends PerfilPermisos>(
  profile: T | null | undefined
): profile is T {
  return tieneRol(profile, ["Admin"]);
}

export function puedeCrearTarea<T extends PerfilPermisos>(
  profile: T | null | undefined
): profile is T {
  return tieneRol(profile, ["Admin", "Profesor", "Head Coach", "Secretaria"]);
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
export function puedeEditarTarea<T extends PerfilPermisos>(
  profile: T | null | undefined,
  tarea: TareaPermisos
): profile is T {
  if (!profile) return false;
  if (profile.rol === "Admin" || profile.rol === "Head Coach" || profile.rol === "Secretaria") {
    return true;
  }
  if (profile.rol === "Profesor") {
    return tarea.created_by === profile.id || esResponsable(profile, tarea);
  }
  return false;
}

export function puedeCambiarEstadoTarea<T extends PerfilPermisos>(
  profile: T | null | undefined,
  tarea: TareaPermisos
): profile is T {
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
export function puedeGestionarPagos<T extends PerfilPermisos>(
  profile: T | null | undefined
): profile is T {
  return tieneRol(profile, ["Admin", "Head Coach", "Secretaria"]);
}

/**
 * Anular un pago con motivo — la única corrección posible: un pago no se edita
 * ni se borra, se anula y se vuelve a cargar el correcto. Hoy coincide con
 * `puedeGestionarPagos`, pero va aparte por ser una transición destructiva:
 * si algún día se acota, se acota acá y no hay que buscarla.
 */
export function puedeAnularPago<T extends PerfilPermisos>(
  profile: T | null | undefined
): profile is T {
  return tieneRol(profile, ["Admin", "Head Coach", "Secretaria"]);
}

/**
 * El módulo Alumnas entero: listado, ficha, alta, edición y baja. Mismo trío
 * que Pagos y Asistencia, y también el mismo que la RLS de `alumnas` y
 * `contactos`.
 *
 * Vivía duplicado en cada página del módulo (tres condiciones `rol !== …`
 * escritas a mano) y una cuarta vez dentro de `alumnas/actions.ts`. Se
 * consolidó acá al rediseñar el módulo, sin cambiar a quién deja pasar.
 */
export function puedeGestionarAlumnas<T extends PerfilPermisos>(
  profile: T | null | undefined
): profile is T {
  return tieneRol(profile, ["Admin", "Head Coach", "Secretaria"]);
}

/** La recaudación total del club es la excepción de Pagos: Secretaria no la ve. */
export function puedeVerRecaudacion<T extends PerfilPermisos>(
  profile: T | null | undefined
): profile is T {
  return tieneRol(profile, ["Admin", "Head Coach"]);
}

export function puedeVerContadoresDashboard<T extends PerfilPermisos>(
  profile: T | null | undefined
): profile is T {
  return tieneRol(profile, ["Admin", "Head Coach", "Secretaria"]);
}

/**
 * El **calendario** de torneos (`torneos`) es información de interés general
 * del club — vive fuera de Administración en la nav y la ve cualquier rol
 * logueado, incluidas las alumnas con login (Patinador/a). Crear, editar o
 * borrar un evento es solo de Admin y Head Coach.
 *
 * Estos dos vivían en `lib/torneos/permisos.ts`, un segundo archivo de
 * permisos que contradecía la regla de que las reglas viven en uno solo. Se
 * consolidaron acá al pasar los helpers a type guards, antes de la primera
 * pantalla del rediseño.
 */
export function puedeVerTorneos<T extends PerfilPermisos>(
  profile: T | null | undefined
): profile is T {
  return !!profile;
}

export function puedeGestionarTorneos<T extends PerfilPermisos>(
  profile: T | null | undefined
): profile is T {
  return tieneRol(profile, ["Admin", "Head Coach"]);
}

/**
 * La convocatoria de un torneo (`torneo_participantes`): convocar, editar el
 * estado de inscripción y desconvocar. Va aparte de la escritura del calendario
 * de torneos, que es solo Admin y Head Coach: qué torneos corre el club es una
 * decisión deportiva, armar la lista es trabajo administrativo.
 */
export function puedeGestionarConvocatoria<T extends PerfilPermisos>(
  profile: T | null | undefined
): profile is T {
  return tieneRol(profile, ["Admin", "Head Coach", "Secretaria"]);
}

/** Ver la convocatoria sin poder tocarla: se suma Profesor. */
export function puedeVerConvocatoria<T extends PerfilPermisos>(
  profile: T | null | undefined
): profile is T {
  return tieneRol(profile, ["Admin", "Head Coach", "Secretaria", "Profesor"]);
}
