import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { TareaForm } from "@/components/tareas/TareaForm";
import { BackButton } from "@/components/ui/BackButton";
import { crearTarea } from "../actions";

export const metadata: Metadata = { title: "Nueva tarea" };

export default async function NuevaTareaPage() {
  const profile = await getCurrentUserProfile();

  if (!profile || profile.rol === "Empleado" || profile.rol === "Patinador") {
    redirect("/tareas");
  }

  const supabase = await createClient();
  const { data: usuarios } = await supabase
    .from("users")
    .select("id, nombre, rol, cargo")
    .order("nombre");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <BackButton href="/tareas" />
      <h1 className="text-2xl font-bold tracking-tight">Nueva tarea</h1>
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <TareaForm action={crearTarea} usuarios={usuarios ?? []} modo="crear" />
      </div>
    </div>
  );
}
