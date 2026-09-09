import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeGestionarPagos, puedeVerRecaudacion } from "@/lib/permisos";
import { BackButton } from "@/components/ui/BackButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { NavegadorDeMes } from "@/components/pagos/NavegadorDeMes";
import { SaldarDeudaButton } from "@/components/pagos/SaldarDeudaButton";
import { calcularDeudorasDelMes, type Deudora } from "@/lib/pagos/saldo";
import { esDiaDeRecordatorio, mesActualISO } from "@/lib/pagos/reglas";
import { formatMonto } from "@/lib/utils/money";
import { enlaceWhatsapp, primerNombre } from "@/lib/utils/whatsapp";
import { anioMesDeHoy, mesQuery, nombreMes, primerDiaDeMes } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Deudoras" };

/**
 * La pantalla que se mira antes de hablar con una madre.
 *
 * Los dos arreglos de fondo: el recargo deja de estar escondido dentro del
 * monto (se explica arriba y se desglosa en cada línea), y «X días de atraso»
 * deja de repetirse igual en todas las filas — sale del mes, no de la alumna,
 * así que va una sola vez en el encabezado. En su lugar, cada línea dice **por
 * qué** debe.
 */

const CLASE_FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

/** Cuántas se muestran expandidas con acción; el resto colapsa a una línea. */
const CON_ACCION = 2;

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

function Monto({ d }: { d: Deudora }) {
  return (
    <span className="shrink-0 text-right">
      <span className="block text-lg font-semibold tabular-nums text-error-600">
        {formatMonto(d.saldo)}
      </span>
      {/* El desglose es el punto: antes el recargo entraba sumado y sin avisar. */}
      {d.recargo > 0 && d.motivo === "sin_pagar" && (
        <span className="block text-sm tabular-nums text-text-subtle">
          {formatMonto(d.cuota)} + {formatMonto(d.recargo)}
        </span>
      )}
    </span>
  );
}

export default async function DeudorasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const profile = await getCurrentUserProfile();
  if (!puedeGestionarPagos(profile)) {
    redirect("/dashboard");
  }

  const { mes: mesParam } = await searchParams;
  const hoyAM = anioMesDeHoy();
  let anio = hoyAM.anio;
  let mes = hoyAM.mes;
  if (mesParam && /^\d{4}-\d{2}$/.test(mesParam)) {
    const [y, m] = mesParam.split("-").map(Number);
    anio = y;
    mes = m;
  }
  const mesISO = primerDiaDeMes(anio, mes);
  const mesParaLinks = mesQuery(anio, mes);

  const supabase = await createClient();
  const { deudoras, totalAdeudado, diasAtraso, recargoAplicado } = await calcularDeudorasDelMes(
    supabase,
    mesISO
  );

  // Mismo criterio que la entrada del módulo: la Secretaria ve el monto de
  // cada alumna (lo necesita para cobrar) pero no el agregado del club.
  const conTotales = puedeVerRecaudacion(profile);
  const mostrarBanner = mesISO === mesActualISO() && esDiaDeRecordatorio();

  const conAccion = deudoras.slice(0, CON_ACCION);
  const resto = deudoras.slice(CON_ACCION);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackButton href={`/pagos?mes=${mesParaLinks}`} />

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Deudoras</h1>
        <p className="text-sm text-text-subtle">
          {nombreMes(mes)} ·{" "}
          {deudoras.length === 0
            ? "ninguna debe"
            : `${deudoras.length} ${deudoras.length === 1 ? "alumna" : "alumnas"}`}
          {conTotales && deudoras.length > 0 && ` · ${formatMonto(totalAdeudado)}`}
          {diasAtraso > 0 && ` · ${diasAtraso} ${diasAtraso === 1 ? "día" : "días"} de atraso`}
        </p>
      </div>

      <NavegadorDeMes basePath="/pagos/deudoras" anio={anio} mes={mes} />

      {mostrarBanner && (
        <div className="rounded-xl border border-warning-200 bg-warning-50 px-4 py-3">
          <p className="text-sm font-medium text-warning-800">
            Quedan 2 días antes del recargo — {deudoras.length}{" "}
            {deudoras.length === 1 ? "alumna sin pagar" : "alumnas sin pagar"}.
          </p>
        </div>
      )}

      {/* El recargo se explica una vez, arriba, en vez de estar sumado y mudo
          dentro de cada monto. */}
      {recargoAplicado && deudoras.length > 0 && (
        <p className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm">
          Pasó el día 10: los montos incluyen el recargo de{" "}
          {formatMonto(deudoras[0].recargo)}.
        </p>
      )}

      {deudoras.length === 0 ? (
        <EmptyState mensaje="Ninguna alumna tiene saldo pendiente este mes." />
      ) : (
        <>
          <ul className="space-y-3">
            {conAccion.map((d) => {
              const texto = `Hola${d.contacto ? ` ${primerNombre(d.contacto.nombre)}` : ""}! Te escribo del club por la cuota de ${nombreMes(mes).toLowerCase()} de ${d.nombre}: queda un saldo de ${formatMonto(d.saldo)}. ¡Gracias!`;
              const wa = d.contacto ? enlaceWhatsapp(d.contacto.telefono, texto) : null;

              return (
                <li
                  key={d.alumnaId}
                  className={`rounded-xl border bg-surface p-4 shadow-xs ${
                    d.deBaja ? "border-dashed border-border-strong" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/alumnas/${d.alumnaId}`}
                        className={`rounded font-semibold leading-snug hover:text-primary-600 ${CLASE_FOCO}`}
                      >
                        {d.apellido}, {d.nombre}
                      </Link>
                      <p className="mt-0.5 text-sm text-text-subtle">
                        {d.deBaja ? "De baja · debe" : `${d.grupoNombre} · ${porQueDebe(d)}`}
                      </p>
                    </div>
                    <Monto d={d} />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {wa ? (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 rounded-lg border border-border px-3 py-2 text-center text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:border-border-strong ${CLASE_FOCO}`}
                      >
                        Escribir a {primerNombre(d.contacto!.nombre)}
                      </a>
                    ) : (
                      <span className="flex-1 px-1 py-2 text-sm text-text-subtle">
                        {d.contacto
                          ? `${d.contacto.nombre}: ${d.contacto.telefono}`
                          : "Sin contacto cargado"}
                      </span>
                    )}

                    {/* «Cobrar» abre el alta con la alumna y el mes resueltos:
                        desde acá el buscador deja de ser el camino. */}
                    <Link
                      href={`/pagos/nuevo?alumna=${d.alumnaId}&mes=${mesParaLinks}`}
                      className={`rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 ${CLASE_FOCO}`}
                    >
                      Cobrar
                    </Link>
                  </div>

                  <div className="mt-2">
                    <SaldarDeudaButton
                      alumnaId={d.alumnaId}
                      alumnaNombre={d.nombre}
                      mes={mesParaLinks}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          {resto.length > 0 && (
            <ul className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
              {resto.map((d) => (
                <li
                  key={d.alumnaId}
                  className={d.deBaja ? "border-l-2 border-dashed border-border-strong" : ""}
                >
                  <Link
                    href={`/pagos/nuevo?alumna=${d.alumnaId}&mes=${mesParaLinks}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium leading-snug">
                        {d.apellido}, {d.nombre}
                      </span>
                      <span className="block text-sm text-text-subtle">
                        {d.deBaja ? "De baja · debe" : `${d.grupoNombre} · ${porQueDebe(d)}`}
                      </span>
                    </span>
                    <Monto d={d} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
