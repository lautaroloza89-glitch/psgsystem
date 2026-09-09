import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { BackButton } from "@/components/ui/BackButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { puedeGestionarAsistencia } from "@/lib/asistencia/permisos";

export const metadata: Metadata = { title: "Asistencia por grupo" };

/**
 * El camino largo, para ir a buscar un mes viejo.
 *
 * Era la entrada del módulo y dejó de serlo: el día a día entra por
 * `/asistencia`, que abre en la fecha de hoy con las clases puestas. Esta
 * pantalla queda como el acceso al historial mes a mes de un grupo.
 */
export default async function AsistenciaGruposPage() {
  const profile = await getCurrentUserProfile();
  if (!profile || !puedeGestionarAsistencia(profile.rol)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: grupos } = await supabase.from("grupos").select("id, nombre").order("nombre");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton href="/asistencia" />

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Asistencia por grupo</h1>
        <p className="text-sm text-text-subtle">
          Elegí un grupo para ver sus fechas de clase, mes a mes.
        </p>
      </div>

      {(grupos ?? []).length === 0 ? (
        <EmptyState mensaje="Todavía no hay grupos cargados." />
      ) : (
        <ul className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
          {(grupos ?? []).map((grupo) => (
            <li key={grupo.id}>
              <Link
                href={`/asistencia/grupos/${grupo.id}`}
                className="block px-4 py-3.5 font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
              >
                {grupo.nombre}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
