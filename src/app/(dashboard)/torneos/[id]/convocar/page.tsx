import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeGestionarConvocatoria } from "@/lib/permisos";
import { alumnasParaConvocar } from "@/lib/torneos/convocatoria";
import { convocarAlumnas } from "../../convocatoria-actions";
import { ConvocarAlumnasForm } from "@/components/torneos/ConvocarAlumnasForm";
import { BackButton } from "@/components/ui/BackButton";
import { hoyArgentina } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Convocar alumnas" };

export default async function ConvocarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const profile = await getCurrentUserProfile();
  if (!puedeGestionarConvocatoria(profile)) {
    redirect("/torneos");
  }

  const supabase = await createClient();
  const { data: torneo } = await supabase
    .from("torneos")
    .select("id, nombre")
    .eq("id", id)
    .single();

  if (!torneo) {
    notFound();
  }

  const [alumnas, { data: grupos }] = await Promise.all([
    alumnasParaConvocar(supabase, id, hoyArgentina()),
    supabase.from("grupos").select("id, nombre").order("nombre"),
  ]);

  const convocarAlTorneo = convocarAlumnas.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <BackButton href={`/torneos/${id}`} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Convocar alumnas</h1>
        <p className="text-sm text-text-subtle">{torneo.nombre}</p>
      </div>

      <ConvocarAlumnasForm
        action={convocarAlTorneo}
        alumnas={alumnas}
        grupos={grupos ?? []}
      />
    </div>
  );
}
