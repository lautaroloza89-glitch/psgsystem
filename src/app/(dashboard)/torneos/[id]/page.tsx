import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeGestionarTorneos, puedeVerTorneos } from "@/lib/torneos/permisos";
import { hoyArgentina } from "@/lib/utils/date";
import { estadoTorneo, formatRangoFechasTorneo } from "@/lib/torneos/fechas";
import { ICONO_TIPO_TORNEO, LABEL_TIPO_TORNEO } from "@/lib/torneos/tipo";
import { EstadoTorneoBadge } from "@/components/torneos/EstadoTorneoBadge";
import { BorrarTorneoButton } from "@/components/torneos/BorrarTorneoButton";
import { BackButton } from "@/components/ui/BackButton";
import type { TipoTorneo } from "@/types";

export const metadata: Metadata = { title: "Detalle de torneo" };

export default async function TorneoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentUserProfile();
  if (!puedeVerTorneos(profile?.rol)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: torneo } = await supabase
    .from("torneos")
    .select("id, nombre, tipo, lugar, fecha_inicio, fecha_fin, notas")
    .eq("id", id)
    .single();

  if (!torneo) {
    notFound();
  }

  const hoy = hoyArgentina();
  const estado = estadoTorneo(torneo.fecha_inicio, torneo.fecha_fin, hoy);
  const puedeEditar = puedeGestionarTorneos(profile?.rol);
  const tipo = torneo.tipo as TipoTorneo;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton href="/torneos" />

      <div className="space-y-6 rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            <span aria-hidden="true" className="mr-2">
              {ICONO_TIPO_TORNEO[tipo]}
            </span>
            {torneo.nombre}
          </h1>
          <EstadoTorneoBadge estado={estado} />
        </div>

        <div className="space-y-1 text-base text-text-muted">
          <p>Tipo: {LABEL_TIPO_TORNEO[tipo]}</p>
          <p>Fecha: {formatRangoFechasTorneo(torneo.fecha_inicio, torneo.fecha_fin)}</p>
          <p>Lugar: {torneo.lugar ?? "En el club"}</p>
        </div>

        {puedeEditar && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/torneos/${torneo.id}/editar`}
              className="inline-block rounded-md border border-border-strong px-4 py-2 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:border-neutral-400 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Editar torneo
            </Link>
            <BorrarTorneoButton torneoId={torneo.id} />
          </div>
        )}
      </div>

      {torneo.notas && (
        <div className="space-y-2 rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
          <h2 className="text-lg font-semibold">Notas</h2>
          <p className="whitespace-pre-wrap text-base text-text-muted">{torneo.notas}</p>
        </div>
      )}
    </div>
  );
}
