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

/**
 * Lo que hay cargado en una fecha. Son dos filas de `turnos` distintas, pero
 * una sola clase: el grupo entrena una vez y en esa franja puede haber patín,
 * preparación física, o las dos.
 */
interface ClaseDelMes {
  patin: TurnoDelMes | null;
  fisica: TurnoDelMes | null;
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

  const [{ data: objetivoData }, { data: turnosData }, { data: fisicaAlgunaVez }] =
    await Promise.all([
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
      // ¿Este grupo hace física? Misma regla que la vista por día
      // (`gruposQueHacenFisica`, `src/lib/horarios/dia.ts`): alcanza con que la
      // haya cargado **alguna vez**, en cualquier fecha, y a partir de ahí el
      // grupo queda marcado solo. Va como consulta aparte y no sobre los turnos
      // del mes, porque un grupo que hace física puede no haber cargado ninguna
      // en el mes que se está mirando — y ahí es justamente donde hay que
      // avisar que falta.
      supabase
        .from("turnos")
        .select("id")
        .eq("grupo_id", grupoId)
        .eq("tipo", "Preparación física")
        .limit(1),
    ]);

  const grupoHaceFisica = (fisicaAlgunaVez ?? []).length > 0;

  const puedeCargar = puedeCargarPlanificaciones(profile);

  // Una fecha puede tener dos filas de `turnos`: la de Patín y la de su
  // Preparación física. Hasta acá el mapa se armaba con la fecha sola de
  // clave, así que la segunda pisaba a la primera y sobrevivía una sola —cuál,
  // dependía del orden en que Postgres devolviera el empate—, con lo que la
  // física no aparecía nunca y, peor, podía mostrarse en el lugar de la de
  // patín sin ningún cartel que lo dijera.
  const clasePorFecha = new Map<string, ClaseDelMes>();
  for (const turno of (turnosData ?? []) as TurnoDelMes[]) {
    const clase = clasePorFecha.get(turno.fecha) ?? { patin: null, fisica: null };
    if (turno.tipo === "Preparación física") clase.fisica = turno;
    else clase.patin = turno;
    clasePorFecha.set(turno.fecha, clase);
  }

  // Todas las fechas de clase del mes, tengan o no planificación cargada. El
  // listado viejo salía de `turnos` con `planificacion is not null`, así que
  // una fecha sin cargar no aparecía en ningún lado: no se podía ver lo que
  // faltaba, solo lo que ya estaba hecho.
  const horarios = (grupo.grupo_horarios ?? []) as unknown as BloqueHorario[];
  const diasDeClase = [...new Set(horarios.flatMap((b) => b.dias))].sort((a, b) => a - b);
  const fechas = diasDeClase.flatMap((dia) => fechasDelMesPorDia(anio, mes, dia)).sort();

  // El número grande cuenta las fechas de clase, que son las de Patín. La
  // física va aparte: no todas las fechas la tienen y sumarlas al mismo total
  // haría que «13 de 13» dejara de significar «no me falta ninguna».
  const cargadas = fechas.filter((f) => clasePorFecha.get(f)?.patin?.planificacion).length;
  const fisicasCargadas = fechas.filter((f) => clasePorFecha.get(f)?.fisica?.planificacion).length;

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
            {fisicasCargadas > 0 && (
              <span className="block text-right">
                + {fisicasCargadas} de preparación física
              </span>
            )}
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
            const clase = clasePorFecha.get(fecha);
            const turno = clase?.patin ?? null;
            const fisica = clase?.fisica ?? null;
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
                </span>
                {turno?.estado === "Cancelado" && <EstadoTurnoBadge estado="Cancelado" />}
              </>
            );

            const filaBase = "flex items-center gap-3 p-4";

            // La física de esa misma fecha, indentada bajo su clase: no repite
            // el día porque es la misma franja, pero es su propia planificación
            // y se abre por separado. Misma grilla que la fila de arriba
            // (`p-4` + una columna de fecha vacía + `gap-3`) para que el texto
            // arranque en la misma línea vertical.
            //
            // Aparece en todas las fechas del grupo, no solo donde ya existe la
            // fila: en un grupo que hace física, una fecha sin ella es un hueco
            // que hay que ver. En los grupos que nunca cargaron una, no aparece
            // nada — la física no es parte de su clase.
            const claseFisica = `${filaBase} border-t border-border py-2 text-sm`;
            const hover =
              "transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset";

            const cuerpoFisica = (
              <>
                <span className="w-12 flex-none" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">Preparación física</span>
                  <span className="block text-text-subtle">
                    {fisica?.planificacion ? (
                      "Planificación cargada"
                    ) : (
                      <span className="font-medium text-warning-800">
                        Sin planificación física
                      </span>
                    )}
                  </span>
                </span>
                {fisica?.estado === "Cancelado" && <EstadoTurnoBadge estado="Cancelado" />}
              </>
            );

            let filaFisica = null;
            if (grupoHaceFisica && fisica) {
              filaFisica = (
                <Link
                  href={`/horarios/${fisica.id}`}
                  aria-label={`${etiqueta}: ver la preparación física`}
                  className={`${claseFisica} ${hover}`}
                >
                  {cuerpoFisica}
                  <span aria-hidden="true" className="flex-none text-text-subtle">
                    ›
                  </span>
                </Link>
              );
            } else if (grupoHaceFisica && puedeCargar) {
              filaFisica = (
                <Link
                  href={`/horarios/grupos/${grupoId}/planificar?mes=${mesQuery(anio, mes)}&fecha=${fecha}&tipo=${encodeURIComponent("Preparación física")}`}
                  aria-label={`${etiqueta}: cargar la preparación física`}
                  className={`${claseFisica} ${hover}`}
                >
                  {cuerpoFisica}
                  <span aria-hidden="true" className="flex-none text-primary-600">
                    +
                  </span>
                </Link>
              );
            } else if (grupoHaceFisica) {
              filaFisica = <div className={claseFisica}>{cuerpoFisica}</div>;
            }

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
                  {filaFisica}
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
                  {filaFisica}
                </li>
              );
            }

            return (
              <li key={fecha}>
                <div className={filaBase}>{contenido}</div>
                {filaFisica}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
