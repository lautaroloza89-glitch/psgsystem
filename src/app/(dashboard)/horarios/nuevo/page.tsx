import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { TurnoForm } from "@/components/horarios/TurnoForm";
import { crearTurno } from "../actions";

export const metadata: Metadata = { title: "Nuevo turno" };

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
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href="/horarios"
          className="rounded text-sm text-text-subtle transition-colors duration-[var(--duration-fast)] ease-standard hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          ← Volver
        </Link>
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Nuevo turno</h1>
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <TurnoForm
          action={crearTurno}
          profile={{ id: profile.id, rol: profile.rol }}
          profesores={profesores}
          modo="crear"
        />
      </div>
    </div>
  );
}
