import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeVerEmailsMiembros, puedeVerModuloMiembros } from "@/lib/permisos";
import { MiembroCard, type MiembroCardData } from "@/components/miembros/MiembroCard";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Miembros del equipo" };

export default async function MiembrosPage() {
  const profile = await getCurrentUserProfile();

  if (!puedeVerModuloMiembros(profile?.rol)) {
    redirect("/dashboard");
  }

  const conEmail = puedeVerEmailsMiembros(profile?.rol);

  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select(conEmail ? "id, nombre, email, rol, cargo" : "id, nombre, rol, cargo")
    .order("nombre");

  const miembros: MiembroCardData[] = (data ?? []) as unknown as MiembroCardData[];

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
