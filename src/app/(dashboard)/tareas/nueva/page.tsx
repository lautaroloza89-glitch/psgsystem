import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { TareaForm } from "@/components/tareas/TareaForm";
import { crearTarea } from "../actions";

export const metadata: Metadata = { title: "Nueva tarea" };

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
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href="/tareas"
          className="rounded text-sm text-text-subtle transition-colors duration-[var(--duration-fast)] ease-standard hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          ← Volver a tareas
        </Link>
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Nueva tarea</h1>
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <TareaForm action={crearTarea} usuarios={usuarios ?? []} modo="crear" />
      </div>
    </div>
  );
}
