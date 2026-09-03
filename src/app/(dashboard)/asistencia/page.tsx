import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { EmptyState } from "@/components/ui/EmptyState";
import { puedeGestionarAsistencia } from "@/lib/asistencia/permisos";

export const metadata: Metadata = { title: "Asistencia" };

export default async function AsistenciaPage() {
  const profile = await getCurrentUserProfile();
  if (!profile || !puedeGestionarAsistencia(profile.rol)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: grupos } = await supabase.from("grupos").select("id, nombre").order("nombre");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Asistencia</h1>

      <Link
        href="/asistencia/alertas"
        className="block rounded-lg border border-border bg-surface p-5 shadow-xs transition duration-[var(--duration-base)] ease-standard hover:border-border-strong hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <h2 className="text-lg font-semibold">Alertas de inasistencia</h2>
        <p className="mt-1 text-sm text-text-subtle">
          Alumnas que llevan 3 semanas seguidas sin venir.
        </p>
      </Link>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Tomar asistencia</h2>
        <p className="text-sm text-text-subtle">
          Elegí un grupo para ver sus fechas de clase, mes a mes.
        </p>

        {(grupos ?? []).length === 0 ? (
          <EmptyState mensaje="Todavía no hay grupos cargados." />
        ) : (
          <div className="space-y-3">
            {(grupos ?? []).map((grupo) => (
              <Link
                key={grupo.id}
                href={`/asistencia/grupos/${grupo.id}`}
                className="block rounded-lg border border-border bg-surface p-5 shadow-xs transition duration-[var(--duration-base)] ease-standard hover:border-border-strong hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <span className="text-lg font-semibold">{grupo.nombre}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
