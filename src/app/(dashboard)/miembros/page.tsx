import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MiembroCard, type MiembroCardData } from "@/components/miembros/MiembroCard";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Miembros del equipo" };

export default async function MiembrosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, nombre, email, rol")
    .order("nombre");

  const miembros: MiembroCardData[] = data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Miembros del equipo</h1>

      {miembros.length === 0 ? (
        <EmptyState mensaje="No hay miembros para mostrar." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {miembros.map((miembro) => (
            <MiembroCard key={miembro.id} miembro={miembro} />
          ))}
        </div>
      )}
    </div>
  );
}
