import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Planificaciones" };

export default async function HorariosPage() {
  const supabase = await createClient();
  const { data: grupos } = await supabase.from("grupos").select("id, nombre").order("nombre");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Planificaciones</h1>
      <p className="text-sm text-text-subtle">
        Elegí un grupo para ver y cargar sus planificaciones, mes a mes.
      </p>

      {(grupos ?? []).length === 0 ? (
        <EmptyState mensaje="Todavía no hay grupos cargados." />
      ) : (
        <div className="space-y-3">
          {(grupos ?? []).map((grupo) => (
            <Link
              key={grupo.id}
              href={`/horarios/grupos/${grupo.id}`}
              className="block rounded-lg border border-border bg-surface p-5 shadow-xs transition duration-[var(--duration-base)] ease-standard hover:border-border-strong hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <span className="text-lg font-semibold">{grupo.nombre}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
