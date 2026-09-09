"use client";

import { useState } from "react";
import { enlaceWhatsapp, primerNombre } from "@/lib/utils/whatsapp";

/**
 * El recibo y qué hacer con él.
 *
 * Hasta ahora el texto aparecía al verificar, se copiaba y no había a dónde
 * pegarlo desde la app: la de WhatsApp la abría la persona a mano. Ahora se
 * manda directo al pagador —el número ya está en la ficha— y copiar queda
 * como alternativa. Si el teléfono no se puede interpretar
 * (`enlaceWhatsapp` devuelve `null`), no se ofrece un botón que abriría el
 * chat equivocado: queda solo copiar.
 */
export function ReciboAcciones({
  texto,
  contactoNombre,
  contactoTelefono,
}: {
  texto: string;
  contactoNombre: string | null;
  contactoTelefono: string | null;
}) {
  const [copiado, setCopiado] = useState(false);
  const wa = enlaceWhatsapp(contactoTelefono, texto);

  async function copiar() {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  const boton =
    "rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

  return (
    <div className="space-y-2">
      <pre className="whitespace-pre-wrap rounded-lg bg-surface p-3 text-sm text-text">
        {texto}
      </pre>

      <div className="flex flex-wrap gap-2">
        {wa && contactoNombre && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className={`${boton} bg-primary-500 text-on-primary hover:bg-primary-600`}
          >
            Mandar a {primerNombre(contactoNombre)}
          </a>
        )}
        <button
          type="button"
          onClick={copiar}
          className={`${boton} border border-border hover:border-border-strong`}
        >
          {copiado ? "Copiado ✓" : "Copiar"}
        </button>
      </div>

      {!wa && contactoTelefono && (
        <p className="text-sm text-text-subtle">
          El teléfono guardado ({contactoTelefono}) no se pudo interpretar para WhatsApp: copiá
          el texto y elegí el contacto a mano.
        </p>
      )}
    </div>
  );
}
