import type { Rol } from "@/types";

/**
 * Quién ve y carga Asistencia: mismo criterio que Alumnas (F2 MOD 2) y Pagos
 * (F2 MOD 3). Vive fuera de `actions.ts` porque un archivo `"use server"` solo
 * puede exportar funciones async.
 */
export function puedeGestionarAsistencia(rol: Rol | undefined): boolean {
  return rol === "Admin" || rol === "Head Coach" || rol === "Secretaria";
}
