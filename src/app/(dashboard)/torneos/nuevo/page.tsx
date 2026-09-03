import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeGestionarTorneos } from "@/lib/torneos/permisos";
import { TorneoForm } from "@/components/torneos/TorneoForm";
import { BackButton } from "@/components/ui/BackButton";
import { crearTorneo } from "../actions";

export const metadata: Metadata = { title: "Nuevo torneo" };

export default async function NuevoTorneoPage() {
  const profile = await getCurrentUserProfile();
  if (!puedeGestionarTorneos(profile?.rol)) {
    redirect("/torneos");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <BackButton href="/torneos" />
      <h1 className="text-2xl font-bold tracking-tight">Nuevo torneo</h1>
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <TorneoForm action={crearTorneo} />
      </div>
    </div>
  );
}
