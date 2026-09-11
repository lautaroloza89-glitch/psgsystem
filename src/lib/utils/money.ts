export function formatMonto(numero: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(numero);
}

/** `60000` → `60.000`: el número sin el signo, para mostrar dentro de un campo. */
export function formatNumero(numero: number): string {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(numero);
}

/**
 * Lee un monto escrito a mano: `60.000`, `60000`, `$ 60.000` o `60.000,50`.
 * El punto se toma como separador de miles, que es como se escribe en
 * Argentina. Devuelve `null` si queda vacío y `NaN` si no es un número.
 */
export function parsearMonto(texto: string): number | null {
  const limpio = texto.replace(/[$\s.]/g, "").replace(",", ".");
  if (!limpio) return null;
  return /^\d+(\.\d{1,2})?$/.test(limpio) ? Number(limpio) : NaN;
}
