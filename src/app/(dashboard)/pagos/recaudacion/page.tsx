import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { BackButton } from "@/components/ui/BackButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatMonto } from "@/lib/utils/money";
import { mesAnteriorSiguiente, mesQuery, nombreMes, primerDiaDeMes } from "@/lib/utils/date";
import type { MetodoPago } from "@/types";

export const metadata: Metadata = { title: "Recaudación del mes" };

const LABELS_METODO: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  debito: "Débito",
};

export default async function RecaudacionPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const profile = await getCurrentUserProfile();
  if (
    !profile ||
    (profile.rol !== "Admin" && profile.rol !== "Head Coach" && profile.rol !== "Secretaria")
  ) {
    redirect("/dashboard");
  }

  const { mes: mesParam } = await searchParams;
  const hoy = new Date();
  let anio = hoy.getFullYear();
  let mes = hoy.getMonth() + 1;
  if (mesParam && /^\d{4}-\d{2}$/.test(mesParam)) {
    const [y, m] = mesParam.split("-").map(Number);
    anio = y;
    mes = m;
  }
  const mesISO = primerDiaDeMes(anio, mes);
  const { anterior, siguiente } = mesAnteriorSiguiente(anio, mes);

  const supabase = await createClient();
  const { data: pagosVerificados } = await supabase
    .from("pagos")
    .select("id, monto")
    .eq("mes_correspondiente", mesISO)
    .eq("estado", "verificado");

  const total = (pagosVerificados ?? []).reduce((acc, p) => acc + Number(p.monto), 0);
  const pagoIds = (pagosVerificados ?? []).map((p) => p.id);

  const porMetodo = new Map<string, number>();
  if (pagoIds.length > 0) {
    const { data: metodosData } = await supabase
      .from("pagos_metodos")
      .select("metodo, monto")
      .in("pago_id", pagoIds);

    for (const m of metodosData ?? []) {
      porMetodo.set(m.metodo, (porMetodo.get(m.metodo) ?? 0) + Number(m.monto));
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton href="/pagos" />
      <h1 className="text-2xl font-bold tracking-tight">Recaudación del mes</h1>

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2.5">
        <Link
          href={`/pagos/recaudacion?mes=${mesQuery(anterior.anio, anterior.mes)}`}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          ← Anterior
        </Link>
        <span className="text-sm font-semibold">
          {nombreMes(mes)} {anio}
        </span>
        <Link
          href={`/pagos/recaudacion?mes=${mesQuery(siguiente.anio, siguiente.mes)}`}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Siguiente →
        </Link>
      </div>

      {!pagosVerificados || pagosVerificados.length === 0 ? (
        <EmptyState mensaje="Todavía no hay pagos verificados este mes." />
      ) : (
        <div className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
          <div>
            <p className="text-sm text-text-subtle">Total recaudado</p>
            <p className="text-3xl font-bold tracking-tight">{formatMonto(total)}</p>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-sm font-medium">Desglose por método</p>
            <ul className="space-y-1">
              {Array.from(porMetodo.entries()).map(([metodo, monto]) => (
                <li key={metodo} className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">{LABELS_METODO[metodo as MetodoPago] ?? metodo}</span>
                  <span className="font-medium">{formatMonto(monto)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
