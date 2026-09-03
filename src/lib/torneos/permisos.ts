import type { Rol } from "@/types";

/**
 * Primer módulo del proyecto donde lectura y escritura no coinciden: el
 * calendario de torneos es información de interés general del club (vive
 * fuera de Administración en la nav), visible para cualquier rol logueado
 * — incluidas las alumnas con login (Patinador/a). Solo Admin y Head Coach
 * pueden crear, editar o borrar.
 */
export function puedeVerTorneos(rol: Rol | undefined): boolean {
  return !!rol;
}

export function puedeGestionarTorneos(rol: Rol | undefined): boolean {
  return rol === "Admin" || rol === "Head Coach";
}
