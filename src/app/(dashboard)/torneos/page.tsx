import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeGestionarTorneos, puedeVerTorneos } from "@/lib/torneos/permisos";
import { hoyArgentina } from "@/lib/utils/date";
import { estadoTorneo } from "@/lib/torneos/fechas";
import { TorneoCard } from "@/components/torneos/TorneoCard";
import { TorneoDestacado } from "@/components/torneos/TorneoDestacado";
import { FiltroAnioTorneos } from "@/components/torneos/FiltroAnioTorneos";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Torneos" };

export default async function TorneosPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string }>;
}) {
  const profile = await getCurrentUserProfile();
  if (!puedeVerTorneos(profile?.rol)) {
    redirect("/dashboard");
  }

  const { anio: anioParam } = await searchParams;
  const hoy = hoyArgentina();
  const anioReal = Number(hoy.slice(0, 4));
  const anioElegido = anioParam ? Number(anioParam) : anioReal;

  const supabase = await createClient();
  const { data: torneosData } = await supabase
    .from("torneos")
    .select("id, nombre, tipo, lugar, fecha_inicio, fecha_fin")
    .order("fecha_inicio", { ascending: true });

  const torneos = torneosData ?? [];

  const destacado =
    torneos.find((t) => estadoTorneo(t.fecha_inicio, t.fecha_fin, hoy) !== "Pasado") ?? null;

  const anios = Array.from(
    new Set([anioReal, ...torneos.map((t) => Number(t.fecha_inicio.slice(0, 4)))])
  ).sort((a, b) => a - b);

  const torneosDelAnio = torneos.filter(
    (t) => t.fecha_inicio.slice(0, 4) === String(anioElegido)
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Torneos</h1>
        {puedeGestionarTorneos(profile?.rol) && (
          <Link
            href="/torneos/nuevo"
            className="inline-block rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Nuevo torneo
          </Link>
        )}
      </div>

      {torneos.length === 0 ? (
        <EmptyState mensaje="Todavía no hay torneos cargados." />
      ) : (
        <>
          {destacado && <TorneoDestacado torneo={destacado} hoy={hoy} />}

          <FiltroAnioTorneos anios={anios} anioActual={anioElegido} />

          {torneosDelAnio.length === 0 ? (
            <EmptyState mensaje={`No hay torneos cargados en ${anioElegido}.`} />
          ) : (
            <div className="space-y-3">
              {torneosDelAnio.map((torneo) => (
                <TorneoCard key={torneo.id} torneo={torneo} hoy={hoy} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
