/**
 * Enlace de WhatsApp a un contacto de la ficha.
 *
 * Los teléfonos se cargan a mano y sin formato fijo («351 682 4417»,
 * «0351 15 682 4417», «+54 9 351…»), así que armar el link es una apuesta.
 * La apuesta se hace solo cuando el número es reconocible y, si no lo es,
 * `null` — y la pantalla cae al plan B (copiar el texto y elegir el contacto
 * a mano). Vale más un botón que no aparece que uno que abre el chat
 * equivocado.
 */

/** Prefijo de Argentina para móviles: país 54 + el 9 de celular. */
const ARGENTINA_MOVIL = "549";

/**
 * Número en formato `wa.me` (solo dígitos, con país), o `null` si no se puede
 * afirmar cuál es.
 *
 * - 10 dígitos («3516824417»): número local, se le antepone `549`.
 * - Ya empieza con `54` y tiene 12 o 13: se usa tal cual.
 * - Cualquier otra cosa (un 0 y un 15 en el medio, un largo raro, vacío):
 *   `null`. No se adivina.
 */
export function numeroWhatsapp(telefono: string | null | undefined): string | null {
  if (!telefono) return null;

  let digitos = telefono.replace(/\D/g, "");
  if (digitos.startsWith("0")) digitos = digitos.slice(1);

  if (digitos.length === 10) return `${ARGENTINA_MOVIL}${digitos}`;
  if (digitos.startsWith("54") && (digitos.length === 12 || digitos.length === 13)) return digitos;

  return null;
}

/** URL de `wa.me` con el texto ya cargado, o `null` si el número no es reconocible. */
export function enlaceWhatsapp(
  telefono: string | null | undefined,
  texto?: string
): string | null {
  const numero = numeroWhatsapp(telefono);
  if (!numero) return null;

  const base = `https://wa.me/${numero}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}

/** «Silvina Cabrera» → «Silvina». Los botones dicen el nombre, no el número. */
export function primerNombre(nombre: string): string {
  return nombre.trim().split(/\s+/)[0] ?? nombre;
}
