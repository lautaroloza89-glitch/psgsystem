import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeGestionarPagos, puedeVerRecaudacion } from "@/lib/permisos";
import { Icono } from "@/components/ui/Icono";
import { NavegadorDeMes } from "@/components/pagos/NavegadorDeMes";
import { calcularEstadoDelMes } from "@/lib/pagos/mes";
import { esDiaDeRecordatorio, mesActualISO } from "@/lib/pagos/reglas";
import { formatMonto } from "@/lib/utils/money";
import { anioMesDeHoy, mesQuery, nombreMes, primerDiaDeMes } from "@/lib/utils/date";
import type { MetodoPago } from "@/types";

export const metadata: Metadata = { title: "Pagos" };

/**
 * La entrada del módulo dejó de ser un menú.
 *
 * Eran cuatro tarjetas que solo describían a dónde llevaban: para saber si
 * había pagos esperando verificación o cuántas alumnas debían, había que
 * entrar y salir de las cuatro. Ahora la pantalla es **cómo viene el mes**, y
 * cada línea lleva a su pantalla con el número ya adentro.
 */

const LABELS_METODO: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  debito: "Débito",
};

const CLASE_FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

function enPlural(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

function LineaAccion({
  href,
  titulo,
  detalle,
  monto,
  tono = "normal",
}: {
  href: string;
  titulo: string;
  detalle: string;
  /** El agregado de plata: solo lo ve quien puede ver la recaudación. */
  monto: string | null;
  tono?: "normal" | "atencion";
}) {
  return (
    <li>
      <Link
        href={href}
        className={`flex items-center justify-between gap-3 px-4 py-3.5 transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring`}
      >
        <span className="min-w-0">
          <span
            className={`block font-semibold leading-snug ${tono === "atencion" ? "text-warning-800" : ""}`}
          >
            {titulo}
          </span>
          <span className="block text-sm text-text-subtle">{detalle}</span>
        </span>
        {monto && (
          <span className="shrink-0 text-sm font-medium tabular-nums text-text-subtle">
            {monto}
          </span>
        )}
      </Link>
    </li>
  );
}

export default async function PagosPage({
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
  const estado = await calcularEstadoDelMes(supabase, mesISO);

  // La recaudación del club es la excepción del módulo: la Secretaria no la
  // ve. Tampoco los montos agregados de las dos alertas — sí el monto de cada
  // alumna, que es lo que necesita para cobrar.
  const conRecaudacion = puedeVerRecaudacion(profile);

  const mostrarBanner = mesISO === mesActualISO() && esDiaDeRecordatorio();
  const { deudoras, totalAdeudado, recargoAplicado } = estado.deudoras;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Pagos</h1>
        {/* Es la acción del módulo, no una sección: sube al encabezado. */}
        <Link
          href="/pagos/nuevo"
          className={`inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 ${CLASE_FOCO}`}
        >
          <Icono nombre="money" className="h-4 w-4" />
          Registrar
        </Link>
      </div>

      {/* Un solo navegador de mes: las cuatro vistas respetan el que elijas. */}
      <NavegadorDeMes basePath="/pagos" anio={anio} mes={mes} />

      {mostrarBanner && (
        <div className="rounded-xl border border-warning-200 bg-warning-50 px-4 py-3">
          <p className="text-sm font-medium text-warning-800">
            Quedan 2 días antes del recargo —{" "}
            {enPlural(deudoras.length, "alumna sin pagar", "alumnas sin pagar")}.
          </p>
        </div>
      )}

      {conRecaudacion && (
        <section
          aria-labelledby="recaudacion-titulo"
          className="rounded-xl border border-border bg-surface p-4"
        >
          <h2 id="recaudacion-titulo" className="text-sm font-medium text-text-subtle">
            Recaudado y verificado
          </h2>
          <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
            {formatMonto(estado.recaudacion.total)}
          </p>

          {estado.recaudacion.porMetodo.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {estado.recaudacion.porMetodo.map((m) => (
                <li key={m.metodo} className="text-sm text-text-subtle">
                  {LABELS_METODO[m.metodo] ?? m.metodo}{" "}
                  <span className="font-medium tabular-nums text-text">
                    {formatMonto(m.monto)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <Link
            href={`/pagos/recaudacion?mes=${mesParaLinks}`}
            className={`mt-3 inline-block rounded text-sm font-medium text-primary-600 hover:text-primary-700 ${CLASE_FOCO}`}
          >
            Ver el detalle
          </Link>
        </section>
      )}

      <ul className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
        {estado.pendientes.cantidad > 0 && (
          <LineaAccion
            href={`/pagos/pendientes?mes=${mesParaLinks}`}
            titulo={enPlural(estado.pendientes.cantidad, "pago sin verificar", "pagos sin verificar")}
            detalle={
              estado.pendientes.diasDelMasViejo === 0
                ? "El más viejo, de hoy"
                : `El más viejo, de hace ${enPlural(estado.pendientes.diasDelMasViejo, "día", "días")}`
            }
            monto={conRecaudacion ? formatMonto(estado.pendientes.total) : null}
            tono="atencion"
          />
        )}

        {deudoras.length > 0 && (
          <LineaAccion
            href={`/pagos/deudoras?mes=${mesParaLinks}`}
            titulo={`${enPlural(deudoras.length, "alumna debe", "alumnas deben")}`}
            detalle={recargoAplicado ? "Con recargo aplicado" : "Todavía sin recargo"}
            monto={conRecaudacion ? formatMonto(totalAdeudado) : null}
            tono="atencion"
          />
        )}

        {/* La buena noticia también es información: un mes sin deudoras no es
            una pantalla vacía. */}
        <li className="flex items-center gap-2 px-4 py-3.5">
          <Icono nombre="check-square" className="h-5 w-5 shrink-0 text-success-600" />
          <span className="text-sm font-medium text-success-700 tabular-nums">
            {estado.alDia} de {estado.conCuota} al día
          </span>
        </li>
      </ul>

      {estado.activasSinGrupo > 0 && (
        <p className="text-sm text-text-subtle">
          {enPlural(estado.activasSinGrupo, "alumna sin grupo", "alumnas sin grupo")} — no{" "}
          {estado.activasSinGrupo === 1 ? "entra" : "entran"} en el cálculo, porque sin grupo no
          hay cuota.{" "}
          <Link
            href="/alumnas"
            className={`rounded font-medium text-primary-600 hover:text-primary-700 ${CLASE_FOCO}`}
          >
            Ver alumnas
          </Link>
        </p>
      )}

      <p className="text-sm text-text-subtle">
        {nombreMes(mes)} {anio} ·{" "}
        <Link
          href={`/pagos/deudoras?mes=${mesParaLinks}`}
          className={`rounded font-medium text-primary-600 hover:text-primary-700 ${CLASE_FOCO}`}
        >
          Deudoras
        </Link>{" "}
        ·{" "}
        <Link
          href={`/pagos/pendientes?mes=${mesParaLinks}`}
          className={`rounded font-medium text-primary-600 hover:text-primary-700 ${CLASE_FOCO}`}
        >
          Pendientes de verificar
        </Link>
      </p>
    </div>
  );
}
