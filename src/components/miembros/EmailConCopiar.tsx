"use client";

import { useState } from "react";

/**
 * El email vive acá y no en el listado: es el dato más sensible del módulo y
 * el uso real es copiarlo, no leerlo de pasada.
 */
export function EmailConCopiar({ email }: { email: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(email);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles (o sin HTTPS) el mail igual se ve y se
      // puede seleccionar a mano: no hace falta avisar nada.
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="min-w-0 truncate">{email}</span>
      <button
        type="button"
        onClick={copiar}
        className="flex-none rounded px-1 text-sm font-medium text-primary-600 transition-colors duration-[var(--duration-fast)] ease-standard hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {copiado ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
