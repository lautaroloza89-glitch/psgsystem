import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeCrearTarea } from "@/lib/permisos";
import { TareaForm } from "@/components/tareas/TareaForm";
import { BackButton } from "@/components/ui/BackButton";
import { hoyArgentina } from "@/lib/utils/date";
import { crearTarea } from "../actions";

export const metadata: Metadata = { title: "Nueva tarea" };

export default async function NuevaTareaPage() {
  const profile = await getCurrentUserProfile();

  if (!puedeCrearTarea(profile)) {
    redirect("/tareas");
  }

  const supabase = await createClient();
  const { data: usuarios } = await supabase
    .from("users")
    .select("id, nombre, rol, cargo")
    .eq("estado", "activo")
    // Solo el personal del club: una tarea no se le asigna a una alumna con
    // login, y hasta ahora el selector las listaba a todas.
    .neq("rol", "Patinador")
    .order("nombre");

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="flex items-center gap-2">
        <BackButton href="/tareas" />
        <h1 className="text-xl font-bold tracking-tight">Nueva tarea</h1>
      </div>
      <TareaForm
        action={crearTarea}
        usuarios={usuarios ?? []}
        modo="crear"
        hoy={hoyArgentina()}
      />
    </div>
  );
}
