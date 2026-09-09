import Link from "next/link";
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
import { nombreMes } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Alertas de inasistencia" };

const CLASE_FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

/** «7 de agosto» — la fecha se lee, no se transcribe. */
function fechaLarga(fecha: string): string {
  const [, mes, dia] = fecha.split("-").map(Number);
  return `${dia} de ${nombreMes(mes).toLowerCase()}`;
}

export default async function AlertasInasistenciaPage() {
  const profile = await getCurrentUserProfile();
  if (!profile || !puedeGestionarAsistencia(profile.rol)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const alertas = await calcularAlertasInasistencia(supabase);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackButton href="/asistencia" />

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Alertas</h1>
        <p className="text-sm text-text-subtle">
          {alertas.length === 0
            ? "Ninguna alumna llega a la racha."
            : `${alertas.length} ${alertas.length === 1 ? "alumna" : "alumnas"} · ${SEMANAS_PARA_ALERTA} semanas o más`}
        </p>
      </div>

      {alertas.length === 0 ? (
        <EmptyState
          mensaje={`Ninguna alumna llega a las ${SEMANAS_PARA_ALERTA} semanas seguidas sin venir.`}
        />
      ) : (
        <ul className="space-y-3">
          {alertas.map((alerta) => (
            <li
              key={alerta.alumnaId}
              className="rounded-xl border border-border bg-surface p-4 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {/* El nombre lleva a la ficha, que es donde se da de baja a
                      una alumna — y darla de baja es lo que apaga la alerta. */}
                  <Link
                    href={`/alumnas/${alerta.alumnaId}`}
                    className={`rounded font-semibold leading-snug hover:text-primary-600 ${CLASE_FOCO}`}
                  >
                    {alerta.apellido}, {alerta.nombre}
                  </Link>
                  <p className="mt-0.5 text-sm text-text-subtle">
                    {alerta.grupoNombre}
                    {alerta.ultimaPresencia
                      ? ` · última vez el ${fechaLarga(alerta.ultimaPresencia)}`
                      : ` · sin presentes en ${SEMANAS_VENTANA} semanas`}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-error-50 px-2.5 py-1 text-sm font-medium tabular-nums text-error-700">
                  {alerta.semanasSinPresente} sem
                </span>
              </div>

              {/* El teléfono deja de mostrarse como número: nadie lo transcribe,
                  lo tocan. Y «sin contacto» pasa de lástima a acción. */}
              {alerta.contacto ? (
                <a
                  href={`tel:${alerta.contacto.telefono.replace(/\s/g, "")}`}
                  className={`mt-3 flex h-11 w-full items-center justify-center rounded-lg border border-border bg-surface text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:border-border-strong ${CLASE_FOCO}`}
                >
                  Llamar a {alerta.contacto.nombre.split(" ")[0]}
                </a>
              ) : (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-text-subtle">Sin contacto cargado</span>
                  <Link
                    href={`/alumnas/${alerta.alumnaId}/editar`}
                    className={`rounded-lg border border-border px-4 py-2 text-sm font-medium text-primary-600 transition-colors duration-[var(--duration-fast)] ease-standard hover:border-border-strong ${CLASE_FOCO}`}
                  >
                    Agregar
                  </Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* La explicación del cálculo baja al pie: es la respuesta a «¿por qué
          aparece esta?», no lo primero que hay que leer. */}
      <div className="rounded-xl border border-border bg-surface-muted p-4">
        <p className="text-sm font-medium">Cómo se cuenta</p>
        <p className="mt-1 text-sm text-text-subtle">
          {SEMANAS_PARA_ALERTA} semanas cerradas seguidas sin ningún presente. La semana en curso
          no cuenta, y las semanas sin clase o sin cargar se saltean.
        </p>
      </div>
    </div>
  );
}
