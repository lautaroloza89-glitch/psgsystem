import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { TurnoForm } from "@/components/horarios/TurnoForm";
import { crearTurno } from "../actions";

export default async function NuevoTurnoPage() {
  const profile = await getCurrentUserProfile();

  if (!profile || profile.rol === "Empleado") {
    redirect("/horarios");
  }

  const supabase = await createClient();
  const { data: usuarios } = await supabase
    .from("users")
    .select("id, nombre, rol, dicta_clases")
    .order("nombre");

  const profesores = (usuarios ?? []).filter((u) => u.rol === "Profesor" || u.dicta_clases);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Nuevo turno</h1>
      <TurnoForm
        action={crearTurno}
        profile={{ id: profile.id, rol: profile.rol }}
        profesores={profesores}
        modo="crear"
      />
    </div>
  );
}
