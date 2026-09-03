const DIACRITICOS = new RegExp("[\\u0300-\\u036f]", "g");

/** Minúsculas y sin acentos, para comparar texto de búsqueda sin distinguir tildes. */
export function normalizarTexto(texto: string): string {
  return texto.toLowerCase().normalize("NFD").replace(DIACRITICOS, "");
}
