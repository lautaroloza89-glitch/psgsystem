/**
 * De dónde se abrió la ficha de una alumna, para que la flecha de volver
 * regrese ahí y no siempre al Registro.
 *
 * Va en la URL (`/alumnas/[id]?from=deudoras&mes=2026-09`) y no con
 * `router.back()`: el historial del navegador no existe en un link directo, un
 * refresh o una ficha abierta en otra pestaña. Sin `from`, se vuelve al
 * Registro, que era el comportamiento de siempre.
 */
export type OrigenFicha = "deudoras" | "pendientes";

const ORIGENES: OrigenFicha[] = ["deudoras", "pendientes"];

/** El link a la ficha, con el origen adentro. `mes` en formato `YYYY-MM`. */
export function enlaceFicha(alumnaId: string, origen: OrigenFicha, mes: string): string {
  return `/alumnas/${alumnaId}?from=${origen}&mes=${mes}`;
}

/**
 * A dónde lleva la flecha de la ficha. Solo acepta orígenes conocidos: el
 * parámetro viene de la URL y no puede convertirse en un redirect a cualquier
 * lado.
 */
export function volverDesdeFicha(
  alumnaId: string,
  from: string | undefined,
  mes: string | undefined
): string {
  if (!from || !ORIGENES.includes(from as OrigenFicha)) return "/alumnas";

  const mesValido = mes && /^\d{4}-\d{2}$/.test(mes) ? `?mes=${mes}` : "";

  // En Deudores cada alumna tiene una sola tarjeta: el ancla devuelve la
  // pantalla a la altura en la que estaba, en vez de arriba de todo.
  if (from === "deudoras") return `/pagos/deudoras${mesValido}#alumna-${alumnaId}`;
  return `/pagos/pendientes${mesValido}`;
}
