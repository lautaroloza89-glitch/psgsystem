import type { Rol } from "@/types";

/**
 * Primer módulo del proyecto donde lectura y escritura no coinciden:
 * Secretaria ve el listado (mismo criterio que Alumnas/Pagos/Asistencia)
 * pero no puede crear, editar ni borrar torneos.
 */
export function puedeVerTorneos(rol: Rol | undefined): boolean {
  return rol === "Admin" || rol === "Head Coach" || rol === "Secretaria";
}

export function puedeGestionarTorneos(rol: Rol | undefined): boolean {
  return rol === "Admin" || rol === "Head Coach";
}
