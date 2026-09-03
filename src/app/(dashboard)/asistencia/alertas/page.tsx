import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { BackButton } from "@/components/ui/BackButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { puedeGestionarAsistencia } from "@/lib/asistencia/permisos";
import {
  SEMANAS_PARA_ALERTA,
  SEMANAS_VENTANA,
  calcularAlertasInasistencia,
} from "@/lib/asistencia/alertas";
import { formatFecha } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Alertas de inasistencia" };

export default async function AlertasInasistenciaPage() {
  const profile = await getCurrentUserProfile();
  if (!profile || !puedeGestionarAsistencia(profile.rol)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const alertas = await calcularAlertasInasistencia(supabase);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton href="/asistencia" />
      <h1 className="text-2xl font-bold tracking-tight">Alertas de inasistencia</h1>

      <p className="text-sm text-text-subtle">
        Alumnas activas con {SEMANAS_PARA_ALERTA} semanas seguidas sin ningún presente. La semana
        en curso no se cuenta, y las semanas sin clase o con la asistencia todavía sin cargar se
        saltean.
      </p>

      {alertas.length === 0 ? (
        <EmptyState
          mensaje={`Ninguna alumna llega a las ${SEMANAS_PARA_ALERTA} semanas seguidas sin venir.`}
        />
      ) : (
        <div className="space-y-3">
          {alertas.map((alerta) => (
            <div
              key={alerta.alumnaId}
              className="rounded-lg border border-border bg-surface p-4 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {alerta.apellido}, {alerta.nombre}
                  </p>
                  <p className="text-sm text-text-subtle">{alerta.grupoNombre}</p>
                </div>
                <span className="shrink-0 rounded-full bg-error-50 px-2.5 py-1 text-sm font-medium text-error-700">
                  {alerta.semanasSinPresente} semanas
                </span>
              </div>

              <p className="mt-2 text-sm text-text-subtle">
                {alerta.ultimaPresencia
                  ? `Última vez presente: ${formatFecha(alerta.ultimaPresencia)}.`
                  : `Sin presentes registrados en las últimas ${SEMANAS_VENTANA} semanas.`}
              </p>

              {alerta.contacto ? (
                <p className="mt-2 text-sm">
                  <span className="text-text-subtle">{alerta.contacto.nombre}: </span>
                  <a
                    href={`tel:${alerta.contacto.telefono.replace(/\s/g, "")}`}
                    className="font-medium text-primary-600 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  >
                    {alerta.contacto.telefono}
                  </a>
                </p>
              ) : (
                <p className="mt-2 text-sm text-text-subtle">Sin contacto cargado.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
