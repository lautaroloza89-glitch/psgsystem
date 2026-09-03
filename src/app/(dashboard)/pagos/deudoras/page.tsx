import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { BackButton } from "@/components/ui/BackButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { calcularDeudorasDelMes } from "@/lib/pagos/saldo";
import { esDiaDeRecordatorio, mesActualISO } from "@/lib/pagos/reglas";
import { formatMonto } from "@/lib/utils/money";
import { mesAnteriorSiguiente, mesQuery, nombreMes, primerDiaDeMes } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Deudoras" };

export default async function DeudorasPage({
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
  const deudoras = await calcularDeudorasDelMes(supabase, mesISO);

  const mostrarBanner = mesISO === mesActualISO() && esDiaDeRecordatorio();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton href="/pagos" />
      <h1 className="text-2xl font-bold tracking-tight">Deudoras</h1>

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2.5">
        <Link
          href={`/pagos/deudoras?mes=${mesQuery(anterior.anio, anterior.mes)}`}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          ← Anterior
        </Link>
        <span className="text-sm font-semibold">
          {nombreMes(mes)} {anio}
        </span>
        <Link
          href={`/pagos/deudoras?mes=${mesQuery(siguiente.anio, siguiente.mes)}`}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Siguiente →
        </Link>
      </div>

      {mostrarBanner && (
        <div className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3">
          <p className="text-sm font-medium text-warning-800">
            Quedan 2 días antes del recargo — {deudoras.length}{" "}
            {deudoras.length === 1 ? "alumna sin pagar" : "alumnas sin pagar"}.
          </p>
        </div>
      )}

      {deudoras.length === 0 ? (
        <EmptyState mensaje="Ninguna alumna tiene saldo pendiente este mes." />
      ) : (
        <div className="space-y-3">
          {deudoras.map((d) => (
            <div key={d.alumnaId} className="rounded-lg border border-border bg-surface p-4 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {d.apellido}, {d.nombre}
                  </p>
                  <p className="text-sm text-text-subtle">{d.grupoNombre}</p>
                </div>
                <p className="text-lg font-semibold text-error-600">{formatMonto(d.saldo)}</p>
              </div>
              {d.diasAtraso > 0 && (
                <p className="mt-2 text-sm text-text-subtle">{d.diasAtraso} días de atraso</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
