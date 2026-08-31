import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { BackButton } from "@/components/ui/BackButton";
import { PlanificarForm } from "@/components/horarios/PlanificarForm";
import { guardarPlanificacion } from "../../../planificaciones-actions";
import { nombreMes } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Nueva planificación" };

export default async function PlanificarPage({
  params,
  searchParams,
}: {
  params: Promise<{ grupoId: string }>;
  searchParams: Promise<{ mes?: string }>;
}) {
  const { grupoId } = await params;
  const { mes: mesParam } = await searchParams;

  const profile = await getCurrentUserProfile();
  // 'Secretaria' todavía no es un valor posible de users.rol (ver PROGRESS.md).
  const puedeCargar =
    !!profile &&
    (profile.rol === "Admin" || profile.rol === "Head Coach" || profile.rol === "Profesor");

  if (!puedeCargar) {
    redirect(`/horarios/grupos/${grupoId}`);
  }

  const hoy = new Date();
  let anio = hoy.getFullYear();
  let mes = hoy.getMonth() + 1;
  if (mesParam && /^\d{4}-\d{2}$/.test(mesParam)) {
    const [y, m] = mesParam.split("-").map(Number);
    anio = y;
    mes = m;
  }

  const supabase = await createClient();
  const { data: grupo } = await supabase
    .from("grupos")
    .select("id, nombre, grupo_horarios(dias)")
    .eq("id", grupoId)
    .single();

  if (!grupo) {
    notFound();
  }

  const diasDisponibles = [
    ...new Set((grupo.grupo_horarios ?? []).flatMap((b) => b.dias as number[])),
  ].sort((a, b) => a - b);

  const guardarPlanificacionDeGrupo = guardarPlanificacion.bind(null, grupoId);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <BackButton href={`/horarios/grupos/${grupoId}`} />
      <h1 className="text-2xl font-bold tracking-tight">Nueva planificación</h1>
      <p className="text-sm text-text-subtle">{grupo.nombre}</p>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        {diasDisponibles.length === 0 ? (
          <p className="text-sm text-text-subtle">
            Este grupo todavía no tiene horario configurado.
          </p>
        ) : (
          <PlanificarForm
            action={guardarPlanificacionDeGrupo}
            diasDisponibles={diasDisponibles}
            anio={anio}
            mes={mes}
            mesLabel={`${nombreMes(mes)} ${anio}`}
          />
        )}
      </div>
    </div>
  );
}
