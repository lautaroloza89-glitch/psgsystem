import Link from "next/link";
import { SaldarDeudaButton } from "@/components/pagos/SaldarDeudaButton";
import { enlaceFicha } from "@/lib/alumnas/origen";
import type { Deudora } from "@/lib/pagos/saldo";
import { formatMonto } from "@/lib/utils/money";
import { enlaceWhatsapp, primerNombre } from "@/lib/utils/whatsapp";

const CLASE_FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

const BOTON_SECUNDARIO = `rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:border-border-strong ${CLASE_FOCO}`;

function porQueDebe(d: Deudora): string {
  switch (d.motivo) {
    case "sin_pagar":
      return "no pagó";
    case "solo_recargo":
      return "solo debe el recargo";
    case "pago_parcial":
      return `pagó ${formatMonto(d.montoPagado)} de ${formatMonto(d.montoEsperado)}`;
  }
}

/**
 * Una alumna que debe, en Deudores. **La misma tarjeta para todas.**
 *
 * Hasta el 2026-09-11 la pantalla mostraba las dos primeras así, con sus
 * acciones, y el resto colapsado a una línea sin botones (`CON_ACCION = 2`):
 * solo se podía cobrar en el orden que proponía la lista, y las familias pagan
 * en cualquier orden. Ahora todas tienen Cobrar y Saldar sin cobrar, y la
 * tarjeta es más baja para que entren varias por pantalla.
 *
 * El nombre abre la ficha (con el origen, para que la flecha vuelva acá). Una
 * baja se tiñe de rojo y lleva su badge, pero conserva los dos botones: son la
 * única forma de cerrarle la deuda.
 */
export function TarjetaDeudora({
  d,
  mes,
  mesNombre,
}: {
  d: Deudora;
  /** `YYYY-MM` */
  mes: string;
  /** «septiembre», para el mensaje de WhatsApp. */
  mesNombre: string;
}) {
  const texto = `Hola${d.contacto ? ` ${primerNombre(d.contacto.nombre)}` : ""}! Te escribo del club por la cuota de ${mesNombre} de ${d.nombre}: queda un saldo de ${formatMonto(d.saldo)}. ¡Gracias!`;
  const wa = d.contacto ? enlaceWhatsapp(d.contacto.telefono, texto) : null;

  return (
    <li
      id={`alumna-${d.alumnaId}`}
      className={`scroll-mt-4 rounded-xl border px-3 py-2.5 shadow-xs ${
        d.deBaja ? "border-error-200 bg-error-50" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <Link
              href={enlaceFicha(d.alumnaId, "deudoras", mes)}
              className={`rounded font-semibold leading-snug hover:text-primary-600 ${CLASE_FOCO}`}
            >
              {d.apellido}, {d.nombre}
            </Link>
            {d.deBaja && (
              <span className="rounded-full bg-error-100 px-2 py-0.5 text-xs font-medium text-error-800">
                Baja
              </span>
            )}
          </div>
          <p className="text-sm text-text-subtle">
            {d.grupoNombre} · {porQueDebe(d)}
          </p>
        </div>

        <span className="shrink-0 text-right">
          <span className="block font-semibold tabular-nums text-error-600">
            {formatMonto(d.saldo)}
          </span>
          {/* El desglose es el punto: antes el recargo entraba sumado y sin avisar. */}
          {d.recargo > 0 && d.motivo === "sin_pagar" && (
            <span className="block text-xs tabular-nums text-text-subtle">
              {formatMonto(d.cuota)} + {formatMonto(d.recargo)}
            </span>
          )}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {/* «Cobrar» abre el alta con la alumna y el mes resueltos. */}
        <Link
          href={`/pagos/nuevo?alumna=${d.alumnaId}&mes=${mes}`}
          className={`rounded-lg bg-primary-500 px-4 py-1.5 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 ${CLASE_FOCO}`}
        >
          Cobrar
        </Link>

        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className={BOTON_SECUNDARIO}>
            Escribir a {primerNombre(d.contacto!.nombre)}
          </a>
        )}

        <SaldarDeudaButton alumnaId={d.alumnaId} alumnaNombre={d.nombre} mes={mes} compacto />

        {!wa && (
          <span className="text-sm text-warning-800">
            {d.contacto ? `${d.contacto.nombre}: ${d.contacto.telefono}` : "Sin contacto cargado"}
          </span>
        )}
      </div>
    </li>
  );
}
