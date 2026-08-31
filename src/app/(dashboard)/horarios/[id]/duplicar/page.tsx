import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { BackButton } from "@/components/ui/BackButton";
import { DuplicarPlanificacionForm } from "@/components/horarios/DuplicarPlanificacionForm";
import { duplicarPlanificacion } from "../../planificaciones-actions";

export const metadata: Metadata = { title: "Duplicar planificación" };

export default async function DuplicarPlanificacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const profile = await getCurrentUserProfile();
  // 'Secretaria' todavía no es un valor posible de users.rol (ver PROGRESS.md).
  const puedeCargar =
    !!profile &&
    (profile.rol === "Admin" || profile.rol === "Head Coach" || profile.rol === "Profesor");

  if (!puedeCargar) {
    redirect(`/horarios/${id}`);
  }

  const supabase = await createClient();
  const { data: turno } = await supabase
    .from("turnos")
    .select("id, tipo, planificacion, grupo_legacy, grupo:grupos(nombre)")
    .eq("id", id)
    .single();

  if (!turno) {
    notFound();
  }

  const grupoNombre =
    (turno.grupo as unknown as { nombre: string } | null)?.nombre ??
    turno.grupo_legacy ??
    "Sin grupo";

  const duplicarPlanificacionDeTurno = duplicarPlanificacion.bind(null, id);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <BackButton href={`/horarios/${id}`} />
      <h1 className="text-2xl font-bold tracking-tight">Duplicar planificación</h1>
      <p className="text-sm text-text-subtle">{grupoNombre}</p>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <DuplicarPlanificacionForm
          action={duplicarPlanificacionDeTurno}
          tipoInicial={turno.tipo}
          planificacionInicial={turno.planificacion ?? ""}
        />
      </div>
    </div>
  );
}
