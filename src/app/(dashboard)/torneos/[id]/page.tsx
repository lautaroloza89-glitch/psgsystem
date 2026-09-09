import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import {
  puedeGestionarConvocatoria,
  puedeGestionarTorneos,
  puedeVerConvocatoria,
  puedeVerTorneos,
} from "@/lib/permisos";
import { convocadasDeTorneo, resumirConvocatoria } from "@/lib/torneos/convocatoria";
import { BloqueConvocatoria } from "@/components/torneos/BloqueConvocatoria";
import { hoyArgentina } from "@/lib/utils/date";
import { estadoTorneo, formatRangoFechasTorneo } from "@/lib/torneos/fechas";
import { EstadoTorneoBadge } from "@/components/torneos/EstadoTorneoBadge";
import { ChipTipoTorneo } from "@/components/torneos/ChipTipoTorneo";
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
  if (!puedeVerTorneos(profile)) {
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

  // Solo se leen las convocadas si el rol puede verlas: para Empleado/a y
  // Patinador/a la lista no existe, tampoco como consulta.
  const convocadas = puedeVerConvocatoria(profile)
    ? await convocadasDeTorneo(supabase, id, puedeGestionarConvocatoria(profile))
    : [];

  const hoy = hoyArgentina();
  const estado = estadoTorneo(torneo.fecha_inicio, torneo.fecha_fin, hoy);
  const puedeEditar = puedeGestionarTorneos(profile);
  const tipo = torneo.tipo as TipoTorneo;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton href="/torneos" />

      <div className="space-y-6 rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{torneo.nombre}</h1>
          <EstadoTorneoBadge estado={estado} />
        </div>

        <div className="space-y-2">
          <ChipTipoTorneo tipo={tipo} />
          <div className="space-y-1 text-base text-text-muted">
            <p>{formatRangoFechasTorneo(torneo.fecha_inicio, torneo.fecha_fin)}</p>
            <p>{torneo.lugar ?? "En el club"}</p>
          </div>
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

      {puedeVerConvocatoria(profile) && (
        <BloqueConvocatoria
          torneoId={torneo.id}
          resumen={resumirConvocatoria(convocadas)}
          puedeGestionar={puedeGestionarConvocatoria(profile)}
          verPlata={puedeGestionarConvocatoria(profile)}
        />
      )}

      {torneo.notas && (
        <div className="space-y-2 rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
          <h2 className="text-lg font-semibold">Notas</h2>
          <p className="whitespace-pre-wrap text-base text-text-muted">{torneo.notas}</p>
        </div>
      )}
    </div>
  );
}
