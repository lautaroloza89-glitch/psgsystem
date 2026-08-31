import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { BackButton } from "@/components/ui/BackButton";
import { ObjetivoMesForm } from "@/components/horarios/ObjetivoMesForm";
import { MarkdownText } from "@/components/ui/MarkdownText";
import { formatFecha, nombreMes, primerDiaDeMes } from "@/lib/utils/date";
import type { TipoTurno } from "@/types";

export const metadata: Metadata = { title: "Planificaciones del grupo" };

const TIPOS: TipoTurno[] = ["Patín", "Preparación física"];

function previewTexto(texto: string, largo = 140): string {
  const plano = texto.replace(/[#*_`>-]/g, "").replace(/\s+/g, " ").trim();
  return plano.length > largo ? `${plano.slice(0, largo)}…` : plano;
}

function mesAnteriorSiguiente(anio: number, mes: number) {
  const anterior = mes === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: mes - 1 };
  const siguiente = mes === 12 ? { anio: anio + 1, mes: 1 } : { anio, mes: mes + 1 };
  return { anterior, siguiente };
}

export default async function PlanificacionesGrupoPage({
  params,
  searchParams,
}: {
  params: Promise<{ grupoId: string }>;
  searchParams: Promise<{ mes?: string }>;
}) {
  const { grupoId } = await params;
  const { mes: mesParam } = await searchParams;

  const hoy = new Date();
  let anio = hoy.getFullYear();
  let mes = hoy.getMonth() + 1;
  if (mesParam && /^\d{4}-\d{2}$/.test(mesParam)) {
    const [y, m] = mesParam.split("-").map(Number);
    anio = y;
    mes = m;
  }

  const profile = await getCurrentUserProfile();
  const supabase = await createClient();

  const { data: grupo } = await supabase.from("grupos").select("id, nombre").eq("id", grupoId).single();
  if (!grupo) {
    notFound();
  }

  const mesISO = primerDiaDeMes(anio, mes);
  const { anterior, siguiente } = mesAnteriorSiguiente(anio, mes);
  const primerDiaSiguiente = primerDiaDeMes(siguiente.anio, siguiente.mes);

  const [{ data: objetivoData }, { data: turnosData }] = await Promise.all([
    supabase
      .from("grupo_objetivos_mes")
      .select("objetivo")
      .eq("grupo_id", grupoId)
      .eq("mes", mesISO)
      .maybeSingle(),
    supabase
      .from("turnos")
      .select("id, fecha, tipo, planificacion")
      .eq("grupo_id", grupoId)
      .gte("fecha", mesISO)
      .lt("fecha", primerDiaSiguiente)
      .not("planificacion", "is", null)
      .order("fecha", { ascending: true }),
  ]);

  // 'Secretaria' todavía no es un valor posible de users.rol (ver PROGRESS.md).
  const puedeCargar =
    !!profile &&
    (profile.rol === "Admin" || profile.rol === "Head Coach" || profile.rol === "Profesor");

  const planificacionesPorTipo = TIPOS.map((tipo) => ({
    tipo,
    items: (turnosData ?? []).filter((t) => t.tipo === tipo),
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton href="/horarios/grupos" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{grupo.nombre}</h1>
        {puedeCargar && (
          <Link
            href={`/horarios/grupos/${grupoId}/planificar?mes=${anio}-${String(mes).padStart(2, "0")}`}
            className="flex items-center justify-center rounded-md bg-primary-500 px-5 py-2.5 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Nueva planificación
          </Link>
        )}
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2.5">
        <Link
          href={`/horarios/grupos/${grupoId}?mes=${anterior.anio}-${String(anterior.mes).padStart(2, "0")}`}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          ← Anterior
        </Link>
        <span className="text-sm font-semibold">
          {nombreMes(mes)} {anio}
        </span>
        <Link
          href={`/horarios/grupos/${grupoId}?mes=${siguiente.anio}-${String(siguiente.mes).padStart(2, "0")}`}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Siguiente →
        </Link>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <h2 className="text-lg font-semibold">Objetivo del mes</h2>
        <ObjetivoMesForm
          grupoId={grupoId}
          mes={mesISO}
          objetivoInicial={objetivoData?.objetivo ?? null}
          puedeEditar={puedeCargar}
          vista={
            objetivoData?.objetivo ? (
              <MarkdownText texto={objetivoData.objetivo} />
            ) : (
              <p className="text-sm text-text-subtle">
                Todavía no se cargó un objetivo para este mes.
              </p>
            )
          }
        />
      </div>

      {planificacionesPorTipo.map(({ tipo, items }) => (
        <div key={tipo} className="space-y-3">
          <h2 className="text-lg font-semibold">{tipo}</h2>
          {items.length === 0 ? (
            <p className="text-sm text-text-subtle">Sin planificaciones cargadas este mes.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/horarios/${item.id}`}
                  className="block rounded-lg border border-border bg-surface p-4 shadow-xs transition duration-[var(--duration-base)] ease-standard hover:border-border-strong hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                >
                  <p className="text-sm font-semibold">{formatFecha(item.fecha)}</p>
                  <p className="mt-1 text-sm text-text-subtle">
                    {item.planificacion ? previewTexto(item.planificacion) : ""}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
