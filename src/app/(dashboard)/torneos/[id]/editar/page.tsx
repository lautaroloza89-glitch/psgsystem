import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeGestionarTorneos } from "@/lib/torneos/permisos";
import { TorneoForm } from "@/components/torneos/TorneoForm";
import { BackButton } from "@/components/ui/BackButton";
import { editarTorneo } from "../../actions";

export const metadata: Metadata = { title: "Editar torneo" };

export default async function EditarTorneoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentUserProfile();
  if (!puedeGestionarTorneos(profile?.rol)) {
    redirect(`/torneos/${id}`);
  }

  const supabase = await createClient();
  const { data: torneo } = await supabase
    .from("torneos")
    .select("id, nombre, tipo, lugar, fecha_inicio, fecha_fin, notas")
    .eq("id", id)
    .single();

  if (!torneo) {
    notFound();
  }

  const editarTorneoConId = editarTorneo.bind(null, id);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <BackButton href={`/torneos/${id}`} />
      <h1 className="text-2xl font-bold tracking-tight">Editar torneo</h1>
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <TorneoForm
          action={editarTorneoConId}
          defaultValues={{
            nombre: torneo.nombre,
            tipo: torneo.tipo,
            lugar: torneo.lugar,
            fecha_inicio: torneo.fecha_inicio,
            fecha_fin: torneo.fecha_fin,
            notas: torneo.notas,
          }}
        />
      </div>
    </div>
  );
}
