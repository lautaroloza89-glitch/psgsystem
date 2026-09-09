import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeVerRecaudacion } from "@/lib/permisos";
import { BackButton } from "@/components/ui/BackButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatMonto } from "@/lib/utils/money";
import { NavegadorDeMes } from "@/components/pagos/NavegadorDeMes";
import { anioMesDeHoy, mesQuery, primerDiaDeMes } from "@/lib/utils/date";
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
  if (!puedeVerRecaudacion(profile)) {
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
      <BackButton href={`/pagos?mes=${mesQuery(anio, mes)}`} />
      <h1 className="text-2xl font-bold tracking-tight">Recaudación del mes</h1>

      <NavegadorDeMes basePath="/pagos/recaudacion" anio={anio} mes={mes} />

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
