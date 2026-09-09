import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeGestionarAlumnas } from "@/lib/permisos";
import { AlumnaForm } from "@/components/alumnas/AlumnaForm";
import { BackButton } from "@/components/ui/BackButton";
import { crearAlumna } from "../actions";

export const metadata: Metadata = { title: "Nueva alumna" };

export default async function NuevaAlumnaPage() {
  const profile = await getCurrentUserProfile();

  if (!puedeGestionarAlumnas(profile)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: grupos } = await supabase.from("grupos").select("id, nombre").order("nombre");

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackButton href="/alumnas" />
      <h1 className="text-2xl font-bold tracking-tight">Nueva alumna</h1>
      <AlumnaForm action={crearAlumna} grupos={grupos ?? []} modo="crear" />
    </div>
  );
}
