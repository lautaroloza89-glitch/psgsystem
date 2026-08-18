import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { TareaForm } from "@/components/tareas/TareaForm";
import { crearTarea } from "../actions";

export default async function NuevaTareaPage() {
  const profile = await getCurrentUserProfile();

  if (!profile || profile.rol === "Empleado") {
    redirect("/tareas");
  }

  const supabase = await createClient();
  const { data: usuarios } = await supabase
    .from("users")
    .select("id, nombre, rol")
    .order("nombre");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Nueva tarea</h1>
      <TareaForm action={crearTarea} usuarios={usuarios ?? []} modo="crear" />
    </div>
  );
}
