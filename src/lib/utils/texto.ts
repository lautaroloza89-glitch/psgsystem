const DIACRITICOS = new RegExp("[\\u0300-\\u036f]", "g");

/** Minúsculas y sin acentos, para comparar texto de búsqueda sin distinguir tildes. */
export function normalizarTexto(texto: string): string {
  return texto.toLowerCase().normalize("NFD").replace(DIACRITICOS, "");
}

/**
 * Orden alfabético de alumnas: por apellido y, de desempate, por nombre.
 *
 * `sensitivity: 'base'` hace que «Álvarez» y «alvarez» ordenen juntos, y el
 * `trim` que un espacio inicial cargado por error no mande a nadie al
 * principio de la lista. Una comparación cruda de strings rompe con las tres
 * cosas.
 */
export function compararAlumnas(
  a: { apellido: string; nombre: string },
  b: { apellido: string; nombre: string }
): number {
  const opciones = { sensitivity: "base" } as const;
  return (
    a.apellido.trim().localeCompare(b.apellido.trim(), "es", opciones) ||
    a.nombre.trim().localeCompare(b.nombre.trim(), "es", opciones)
  );
}

/**
 * ¿La alumna coincide con lo que se escribió en el buscador?
 *
 * Cada palabra de la búsqueda tiene que aparecer en «apellido nombre», así que
 * «ana perez» y «perez ana» encuentran a la misma. Sin distinguir tildes ni
 * mayúsculas.
 */
export function coincideConBusqueda(
  busqueda: string,
  alumna: { apellido: string; nombre: string }
): boolean {
  const palabras = normalizarTexto(busqueda).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return true;
  const texto = normalizarTexto(`${alumna.apellido} ${alumna.nombre}`);
  return palabras.every((p) => texto.includes(p));
}
