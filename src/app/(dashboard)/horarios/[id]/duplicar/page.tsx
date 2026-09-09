import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeCargarPlanificaciones } from "@/lib/permisos";
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
  if (!puedeCargarPlanificaciones(profile)) {
    redirect(`/horarios/${id}`);
  }

  const supabase = await createClient();
  const { data: turno } = await supabase
    .from("turnos")
    .select(
      "id, fecha, tipo, planificacion, grupo_legacy, grupo:grupos(nombre, grupo_horarios(dias))"
    )
    .eq("id", id)
    .single();

  if (!turno) {
    notFound();
  }

  const grupo = turno.grupo as unknown as {
    nombre: string;
    grupo_horarios: { dias: number[] }[] | null;
  } | null;

  const grupoNombre = grupo?.nombre ?? turno.grupo_legacy ?? "Sin grupo";

  // Las fechas ofrecibles son las que el grupo entrena: duplicar a un domingo
  // fallaba recién al guardar, porque el upsert deriva el horario del día de
  // la semana y no encuentra bloque.
  const diasDisponibles = [
    ...new Set((grupo?.grupo_horarios ?? []).flatMap((b) => b.dias)),
  ].sort((a, b) => a - b);

  const duplicarPlanificacionDeTurno = duplicarPlanificacion.bind(null, id);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <BackButton href={`/horarios/${id}`} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Duplicar planificación</h1>
        <p className="text-sm text-text-subtle">{grupoNombre}</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs sm:p-6">
        <DuplicarPlanificacionForm
          action={duplicarPlanificacionDeTurno}
          tipoInicial={turno.tipo}
          planificacionInicial={turno.planificacion ?? ""}
          diasDisponibles={diasDisponibles}
          anioInicial={Number(turno.fecha.slice(0, 4))}
          mesInicial={Number(turno.fecha.slice(5, 7))}
        />
      </div>
    </div>
  );
}
