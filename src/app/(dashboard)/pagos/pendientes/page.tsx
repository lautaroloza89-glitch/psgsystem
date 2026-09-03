import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { BackButton } from "@/components/ui/BackButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { MarcarVerificadoButton } from "@/components/pagos/MarcarVerificadoButton";
import { formatMonto } from "@/lib/utils/money";
import { mesAnteriorSiguiente, mesQuery, nombreMes, primerDiaDeMes } from "@/lib/utils/date";
import type { MetodoPago } from "@/types";

export const metadata: Metadata = { title: "Pendientes de verificar" };

const LABELS_METODO: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  debito: "Débito",
};

export default async function PagosPendientesPage({
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
  const { data: pagos } = await supabase
    .from("pagos")
    .select(
      "id, monto, monto_recargo, alumna:alumnas(apellido, nombre), contacto:contactos(nombre), metodos:pagos_metodos(metodo, monto)"
    )
    .eq("mes_correspondiente", mesISO)
    .eq("estado", "pendiente_verificar")
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton href="/pagos" />
      <h1 className="text-2xl font-bold tracking-tight">Pendientes de verificar</h1>

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2.5">
        <Link
          href={`/pagos/pendientes?mes=${mesQuery(anterior.anio, anterior.mes)}`}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          ← Anterior
        </Link>
        <span className="text-sm font-semibold">
          {nombreMes(mes)} {anio}
        </span>
        <Link
          href={`/pagos/pendientes?mes=${mesQuery(siguiente.anio, siguiente.mes)}`}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Siguiente →
        </Link>
      </div>

      {!pagos || pagos.length === 0 ? (
        <EmptyState mensaje="No hay pagos pendientes de verificar este mes." />
      ) : (
        <div className="space-y-3">
          {pagos.map((p) => {
            const alumna = p.alumna as unknown as { apellido: string; nombre: string } | null;
            const contacto = p.contacto as unknown as { nombre: string } | null;
            return (
              <div key={p.id} className="space-y-3 rounded-lg border border-border bg-surface p-4 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {alumna ? `${alumna.apellido}, ${alumna.nombre}` : "Alumna"}
                    </p>
                    <p className="text-sm text-text-subtle">
                      {contacto ? `Paga: ${contacto.nombre}` : "Sin contacto asignado"}
                    </p>
                  </div>
                  <p className="text-lg font-semibold">{formatMonto(Number(p.monto))}</p>
                </div>
                <p className="text-sm text-text-subtle">
                  {(p.metodos ?? [])
                    .map((m) => `${LABELS_METODO[m.metodo as MetodoPago] ?? m.metodo} ${formatMonto(Number(m.monto))}`)
                    .join(" · ")}
                  {Number(p.monto_recargo) > 0 && ` · Incluye recargo ${formatMonto(Number(p.monto_recargo))}`}
                </p>
                <MarcarVerificadoButton pagoId={p.id} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
