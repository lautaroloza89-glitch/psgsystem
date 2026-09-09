import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeGestionarPagos, puedeVerRecaudacion } from "@/lib/permisos";
import { BackButton } from "@/components/ui/BackButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { MarcarVerificadoButton } from "@/components/pagos/MarcarVerificadoButton";
import { AnularPagoButton } from "@/components/pagos/AnularPagoButton";
import { ReciboAcciones } from "@/components/pagos/ReciboAcciones";
import { NavegadorDeMes } from "@/components/pagos/NavegadorDeMes";
import { formatMonto } from "@/lib/utils/money";
import {
  anioMesDeHoy,
  hoyArgentina,
  mesQuery,
  nombreMes,
  primerDiaDeMes,
} from "@/lib/utils/date";
import type { MetodoPago } from "@/types";

export const metadata: Metadata = { title: "Pendientes de verificar" };

/**
 * Verificar contra el Mercado Pago, y el recibo.
 *
 * Lo que se agrega es lo que ya se guardaba y no se mostraba: **cuánto lleva
 * esperando cada pago y quién lo cargó**. Y el recibo deja de vivir un rato en
 * pantalla y perderse — se guarda en el pago (`recibo_texto`, Bloque 4), así
 * que abajo se puede volver a ver el de cualquier pago ya verificado del mes.
 */

const LABELS_METODO: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  debito: "Débito",
};

interface FilaPago {
  id: string;
  monto: number;
  monto_recargo: number;
  created_at: string;
  recibo_texto: string | null;
  alumna: { apellido: string; nombre: string } | null;
  contacto: { nombre: string; telefono: string } | null;
  registrador: { nombre: string } | null;
  metodos: { metodo: MetodoPago; monto: number }[] | null;
}

const SELECT_PAGO =
  "id, monto, monto_recargo, created_at, recibo_texto, alumna:alumnas(apellido, nombre), contacto:contactos(nombre, telefono), registrador:registrado_por(nombre), metodos:pagos_metodos(metodo, monto)";

function diasEntre(desdeISO: string, hasta: string): number {
  const ms = Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desdeISO.slice(0, 10)}T00:00:00Z`);
  return Math.max(0, Math.round(ms / 86_400_000));
}

function cuandoSeCargo(createdAt: string, hoy: string): string {
  const dias = diasEntre(createdAt, hoy);
  if (dias === 0) return "cargado hoy";
  if (dias === 1) return "cargado ayer";
  return `cargado hace ${dias} días`;
}

function metodosTexto(fila: FilaPago): string {
  const metodos = fila.metodos ?? [];
  if (metodos.length === 0) return "Sin métodos cargados";
  if (metodos.length === 1) return LABELS_METODO[metodos[0].metodo] ?? metodos[0].metodo;
  return metodos
    .map((m) => `${LABELS_METODO[m.metodo] ?? m.metodo} ${formatMonto(Number(m.monto))}`)
    .join(" + ");
}

function nombreAlumna(fila: FilaPago): string {
  return fila.alumna ? `${fila.alumna.apellido}, ${fila.alumna.nombre}` : "Alumna";
}

export default async function PagosPendientesPage({
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
  const hoy = hoyArgentina();

  const supabase = await createClient();
  const [{ data: pendientesData }, { data: verificadosData }] = await Promise.all([
    supabase
      .from("pagos")
      .select(SELECT_PAGO)
      .eq("mes_correspondiente", mesISO)
      .eq("estado", "pendiente_verificar")
      .order("created_at", { ascending: true }),
    supabase
      .from("pagos")
      .select(SELECT_PAGO)
      .eq("mes_correspondiente", mesISO)
      .eq("estado", "verificado")
      .not("recibo_texto", "is", null)
      .order("verificado_en", { ascending: false }),
  ]);

  const pendientes = (pendientesData ?? []) as unknown as FilaPago[];
  const verificados = (verificadosData ?? []) as unknown as FilaPago[];

  const total = pendientes.reduce((acc, p) => acc + Number(p.monto), 0);
  const conTotales = puedeVerRecaudacion(profile);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackButton href={`/pagos?mes=${mesQuery(anio, mes)}`} />

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Sin verificar</h1>
        <p className="text-sm text-text-subtle">
          {nombreMes(mes)} ·{" "}
          {pendientes.length === 0
            ? "ninguno pendiente"
            : `${pendientes.length} ${pendientes.length === 1 ? "pago" : "pagos"}`}
          {conTotales && pendientes.length > 0 && ` · ${formatMonto(total)}`}
        </p>
      </div>

      <NavegadorDeMes basePath="/pagos/pendientes" anio={anio} mes={mes} />

      {pendientes.length === 0 ? (
        <EmptyState mensaje="No hay pagos pendientes de verificar este mes." />
      ) : (
        <ul className="space-y-3">
          {pendientes.map((p) => (
            <li key={p.id} className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold leading-snug">{nombreAlumna(p)}</p>
                  <p className="mt-0.5 text-sm text-text-subtle">
                    {metodosTexto(p)}
                    {p.contacto && ` · paga ${p.contacto.nombre}`}
                  </p>
                  <p className="text-sm text-text-subtle">
                    {cuandoSeCargo(p.created_at, hoy)}
                    {p.registrador && ` por ${p.registrador.nombre.split(" ")[0]}`}
                    {Number(p.monto_recargo) > 0 &&
                      ` · incluye recargo ${formatMonto(Number(p.monto_recargo))}`}
                  </p>
                </div>
                <p className="shrink-0 text-lg font-semibold tabular-nums">
                  {formatMonto(Number(p.monto))}
                </p>
              </div>

              <MarcarVerificadoButton
                pagoId={p.id}
                contactoNombre={p.contacto?.nombre ?? null}
                contactoTelefono={p.contacto?.telefono ?? null}
              />
              <AnularPagoButton pagoId={p.id} />
            </li>
          ))}
        </ul>
      )}

      {/* El recibo dejó de perderse al salir de la pantalla: acá está el de
          cada pago ya verificado del mes, listo para reenviar. */}
      {verificados.length > 0 && (
        <section aria-labelledby="verificados-titulo" className="space-y-3">
          <h2 id="verificados-titulo" className="text-base font-semibold">
            Recibos del mes
          </h2>
          <ul className="space-y-2">
            {verificados.map((p) => (
              <li key={p.id} className="overflow-hidden rounded-xl border border-border bg-surface">
                <details>
                  <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted">
                    <span className="min-w-0">
                      <span className="block font-medium">{nombreAlumna(p)}</span>
                      <span className="block text-text-subtle">
                        {metodosTexto(p)}
                        {p.contacto && ` · ${p.contacto.nombre}`}
                      </span>
                    </span>
                    <span className="shrink-0 font-medium tabular-nums">
                      {formatMonto(Number(p.monto))}
                    </span>
                  </summary>
                  <div className="border-t border-border p-4">
                    <ReciboAcciones
                      texto={p.recibo_texto ?? ""}
                      contactoNombre={p.contacto?.nombre ?? null}
                      contactoTelefono={p.contacto?.telefono ?? null}
                    />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
