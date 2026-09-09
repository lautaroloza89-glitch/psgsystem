import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeCargarPlanificaciones, puedeVerPlanificaciones } from "@/lib/permisos";
import { BackButton } from "@/components/ui/BackButton";
import { ObjetivoMesForm } from "@/components/horarios/ObjetivoMesForm";
import { EstadoTurnoBadge } from "@/components/horarios/EstadoTurnoBadge";
import { NavegadorDeMes } from "@/components/pagos/NavegadorDeMes";
import { MarkdownText } from "@/components/ui/MarkdownText";
import { Icono } from "@/components/ui/Icono";
import { anioMesDeHoy, mesQuery, nombreDia, nombreMes, primerDiaDeMes } from "@/lib/utils/date";
import { diaIsoDeFecha, fechasDelMesPorDia } from "@/lib/utils/date";
import type { BloqueHorario } from "@/lib/asistencia/fechas";
import type { EstadoTurno, TipoTurno } from "@/types";

export const metadata: Metadata = { title: "Planificaciones del grupo" };

interface TurnoDelMes {
  id: string;
  fecha: string;
  tipo: TipoTurno;
  estado: EstadoTurno;
  planificacion: string | null;
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

  const hoyAM = anioMesDeHoy();
  let anio = hoyAM.anio;
  let mes = hoyAM.mes;
  if (mesParam && /^\d{4}-\d{2}$/.test(mesParam)) {
    const [y, m] = mesParam.split("-").map(Number);
    anio = y;
    mes = m;
  }

  const profile = await getCurrentUserProfile();
  if (!puedeVerPlanificaciones(profile)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const { data: grupo } = await supabase
    .from("grupos")
    .select("id, nombre, grupo_horarios(dias, hora_inicio, hora_fin)")
    .eq("id", grupoId)
    .single();
  if (!grupo) {
    notFound();
  }

  const mesISO = primerDiaDeMes(anio, mes);
  const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const finISO = `${mesISO.slice(0, 8)}${String(ultimoDia).padStart(2, "0")}`;

  const [{ data: objetivoData }, { data: turnosData }] = await Promise.all([
    supabase
      .from("grupo_objetivos_mes")
      .select("objetivo")
      .eq("grupo_id", grupoId)
      .eq("mes", mesISO)
      .maybeSingle(),
    supabase
      .from("turnos")
      .select("id, fecha, tipo, estado, planificacion")
      .eq("grupo_id", grupoId)
      .gte("fecha", mesISO)
      .lte("fecha", finISO)
      .order("fecha", { ascending: true }),
  ]);

  const puedeCargar = puedeCargarPlanificaciones(profile);

  const turnoPorFecha = new Map<string, TurnoDelMes>();
  for (const turno of (turnosData ?? []) as TurnoDelMes[]) {
    turnoPorFecha.set(turno.fecha, turno);
  }

  // Todas las fechas de clase del mes, tengan o no planificación cargada. El
  // listado viejo salía de `turnos` con `planificacion is not null`, así que
  // una fecha sin cargar no aparecía en ningún lado: no se podía ver lo que
  // faltaba, solo lo que ya estaba hecho.
  const horarios = (grupo.grupo_horarios ?? []) as unknown as BloqueHorario[];
  const diasDeClase = [...new Set(horarios.flatMap((b) => b.dias))].sort((a, b) => a - b);
  const fechas = diasDeClase.flatMap((dia) => fechasDelMesPorDia(anio, mes, dia)).sort();

  const cargadas = fechas.filter((f) => turnoPorFecha.get(f)?.planificacion).length;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackButton href={`/horarios?vista=grupo&mes=${mesQuery(anio, mes)}`} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{grupo.nombre}</h1>
        {puedeCargar && (
          <Link
            href={`/horarios/grupos/${grupoId}/planificar?mes=${mesQuery(anio, mes)}`}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md bg-primary-500 px-4 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <Icono nombre="plus" className="h-4 w-4" />
            Nueva
          </Link>
        )}
      </div>

      <NavegadorDeMes basePath={`/horarios/grupos/${grupoId}`} anio={anio} mes={mes} />

      <div className="space-y-3 rounded-xl border border-border bg-surface p-5 shadow-xs">
        <h2 className="text-base font-semibold">Objetivo del mes</h2>
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

      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">Clases de {nombreMes(mes).toLowerCase()}</h2>
        {fechas.length > 0 && (
          <p className="text-sm text-text-subtle tabular-nums">
            {cargadas} de {fechas.length} cargadas
          </p>
        )}
      </div>

      {fechas.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-5 text-sm text-text-subtle">
          Este grupo todavía no tiene horario configurado, así que no hay fechas de clase este mes.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {fechas.map((fecha) => {
            const turno = turnoPorFecha.get(fecha);
            const numero = Number(fecha.slice(8, 10));
            const etiqueta = `${nombreDia(diaIsoDeFecha(fecha))} ${numero}`;

            const contenido = (
              <>
                <span className="flex w-12 flex-none flex-col items-center">
                  <span className="text-lg font-semibold tabular-nums">{numero}</span>
                  <span className="text-xs uppercase text-text-subtle">
                    {nombreDia(diaIsoDeFecha(fecha)).slice(0, 3).toLowerCase()}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  {turno?.planificacion ? (
                    <span className="flex items-center gap-1.5 font-medium">
                      <Icono nombre="note" className="h-4 w-4 flex-none text-text-subtle" />
                      Planificación cargada
                    </span>
                  ) : (
                    <span className="font-medium text-warning-800">Sin planificación</span>
                  )}
                  {turno?.tipo === "Preparación física" && (
                    <span className="block text-sm text-text-subtle">Preparación física</span>
                  )}
                </span>
                {turno?.estado === "Cancelado" && <EstadoTurnoBadge estado="Cancelado" />}
              </>
            );

            const filaBase = "flex items-center gap-3 p-4";

            // Las canceladas se muestran igual: el filtro Todas/Activo/Cancelado
            // se sacó porque un mes nunca pasa de ocho o nueve fechas y no hay
            // nada que filtrar; el badge alcanza para distinguirlas.
            if (turno) {
              return (
                <li key={fecha}>
                  <Link
                    href={`/horarios/${turno.id}`}
                    aria-label={`${etiqueta}: ver la clase`}
                    className={`${filaBase} transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset`}
                  >
                    {contenido}
                    <span aria-hidden="true" className="flex-none text-text-subtle">
                      ›
                    </span>
                  </Link>
                </li>
              );
            }

            if (puedeCargar) {
              return (
                <li key={fecha}>
                  <Link
                    href={`/horarios/grupos/${grupoId}/planificar?mes=${mesQuery(anio, mes)}&fecha=${fecha}`}
                    aria-label={`${etiqueta}: cargar la planificación`}
                    className={`${filaBase} transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset`}
                  >
                    {contenido}
                    <span aria-hidden="true" className="flex-none text-primary-600">
                      +
                    </span>
                  </Link>
                </li>
              );
            }

            return (
              <li key={fecha} className={filaBase}>
                {contenido}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
