import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { TurnoForm } from "@/components/horarios/TurnoForm";
import { BackButton } from "@/components/ui/BackButton";
import { crearTurno } from "../actions";

export const metadata: Metadata = { title: "Nueva clase" };

export default async function NuevoTurnoPage() {
  const profile = await getCurrentUserProfile();

  if (!profile || profile.rol === "Empleado" || profile.rol === "Patinador") {
    redirect("/horarios");
  }

  const supabase = await createClient();
  const { data: usuarios } = await supabase
    .from("users")
    .select("id, nombre, rol, cargo, dicta_clases")
    .order("nombre");

  const profesores = (usuarios ?? []).filter((u) => u.rol === "Profesor" || u.dicta_clases);

  const { data: gruposData } = await supabase
    .from("grupos")
    .select("id, nombre, grupo_horarios(id, dias, hora_inicio, hora_fin)")
    .order("nombre");

  const grupos = (gruposData ?? []).map((g) => ({
    id: g.id,
    nombre: g.nombre,
    bloques: g.grupo_horarios ?? [],
  }));

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <BackButton href="/horarios" />
      <h1 className="text-2xl font-bold tracking-tight">Nueva clase</h1>
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <TurnoForm
          action={crearTurno}
          profile={{ id: profile.id, rol: profile.rol }}
          profesores={profesores}
          grupos={grupos}
          modo="crear"
        />
      </div>
    </div>
  );
}
