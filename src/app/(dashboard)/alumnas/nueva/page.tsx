import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { AlumnaForm } from "@/components/alumnas/AlumnaForm";
import { BackButton } from "@/components/ui/BackButton";
import { crearAlumna } from "../actions";

export const metadata: Metadata = { title: "Nueva alumna" };

export default async function NuevaAlumnaPage() {
  const profile = await getCurrentUserProfile();

  if (
    !profile ||
    (profile.rol !== "Admin" && profile.rol !== "Head Coach" && profile.rol !== "Secretaria")
  ) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: grupos } = await supabase.from("grupos").select("id, nombre").order("nombre");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <BackButton href="/alumnas" />
      <h1 className="text-2xl font-bold tracking-tight">Nueva alumna</h1>
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <AlumnaForm action={crearAlumna} grupos={grupos ?? []} modo="crear" />
      </div>
    </div>
  );
}
