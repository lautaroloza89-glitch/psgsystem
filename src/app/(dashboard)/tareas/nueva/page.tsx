import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeCrearTarea } from "@/lib/permisos";
import { TareaForm } from "@/components/tareas/TareaForm";
import { BackButton } from "@/components/ui/BackButton";
import { leerPersonalAsignable } from "@/lib/tareas/asignables";
import { hoyArgentina } from "@/lib/utils/date";
import { crearTarea } from "../actions";

export const metadata: Metadata = { title: "Nueva tarea" };

export default async function NuevaTareaPage() {
  const profile = await getCurrentUserProfile();

  if (!puedeCrearTarea(profile)) {
    redirect("/tareas");
  }

  const supabase = await createClient();
  const usuarios = await leerPersonalAsignable(supabase);

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <BackButton href="/tareas" />
      <h1 className="text-2xl font-bold tracking-tight">Nueva tarea</h1>
      <TareaForm
        action={crearTarea}
        usuarios={usuarios}
        modo="crear"
        hoy={hoyArgentina()}
      />
    </div>
  );
}
