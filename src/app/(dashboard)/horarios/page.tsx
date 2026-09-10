import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeCargarPlanificaciones, puedeVerPlanificaciones } from "@/lib/permisos";
import {
  clasesPlanificadasDelDia,
  gruposDelMes,
  planificacionesQueMeFaltan,
} from "@/lib/horarios/dia";
import { diasDeLaSemana } from "@/lib/asistencia/dia";
import { TiraDeDias } from "@/components/asistencia/TiraDeDias";
import { TabsPlanificaciones } from "@/components/horarios/TabsPlanificaciones";
import { ClaseDelDiaCard } from "@/components/horarios/ClaseDelDiaCard";
import { GrupoDelMesFila } from "@/components/horarios/GrupoDelMesFila";
import { NavegadorDeMes } from "@/components/pagos/NavegadorDeMes";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icono } from "@/components/ui/Icono";
import {
  anioMesDeHoy,
  diaIsoDeFecha,
  hoyArgentina,
  mesQuery,
  nombreDia,
  nombreMes,
} from "@/lib/utils/date";

export const metadata: Metadata = { title: "Planificaciones" };

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const MES_ISO = /^\d{4}-\d{2}$/;

export default async function HorariosPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; dia?: string; mes?: string; mias?: string }>;
}) {
  const profile = await getCurrentUserProfile();
  if (!puedeVerPlanificaciones(profile)) {
    redirect("/dashboard");
  }

  const { vista: vistaParam, dia: diaParam, mes: mesParam, mias: miasParam } = await searchParams;

  const hoy = hoyArgentina();
  const dia = diaParam && FECHA_ISO.test(diaParam) ? diaParam : hoy;

  const hoyAM = anioMesDeHoy();
  const [anio, mes] =
    mesParam && MES_ISO.test(mesParam)
      ? mesParam.split("-").map(Number)
      : [hoyAM.anio, hoyAM.mes];

  const vista = vistaParam === "grupo" ? "grupo" : "dia";

  const puedeCargar = puedeCargarPlanificaciones(profile);
  // El filtro «Mis clases» solo tiene sentido para quien puede tener clases
  // asignadas. Una empleada que además dicta (Male) entra por `dicta_clases`,
  // que es independiente del rol.
  const dictaClases = profile.rol === "Profesor" || profile.dicta_clases;
  // La Profesora arranca por lo suyo y el resto por la pista completa, pero a
  // nadie se le esconde nada: es un orden, no un recorte.
  const miasPorDefecto = profile.rol === "Profesor";
  const soloMias = dictaClases && (miasParam ? miasParam === "1" : miasPorDefecto);

  const supabase = await createClient();

  const hrefDia = `/horarios?dia=${dia}`;
  const hrefGrupo = `/horarios?vista=grupo&mes=${mesQuery(anio, mes)}`;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Planificaciones</h1>
        {/* Solo en «Por grupo»: crear una planificación es elegir un grupo, un
            mes y varias fechas de una, y acá el formulario abre con el mes que
            se está mirando. Desde la vista por día el atajo es el chip «Sin
            planificación» de cada clase, que ya lleva grupo y fecha. */}
        {puedeCargar && vista === "grupo" && (
          <Link
            href={`/horarios/planificar?mes=${mesQuery(anio, mes)}`}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md bg-primary-500 px-4 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <Icono nombre="plus" className="h-4 w-4" />
            Nueva
          </Link>
        )}
      </div>

      <TabsPlanificaciones vista={vista} hrefDia={hrefDia} hrefGrupo={hrefGrupo} />

      {vista === "dia" ? (
        <VistaPorDia
          supabase={supabase}
          dia={dia}
          hoy={hoy}
          profileId={profile.id}
          puedeCargar={puedeCargar}
          dictaClases={dictaClases}
          soloMias={soloMias}
        />
      ) : (
        <VistaPorGrupo supabase={supabase} anio={anio} mes={mes} />
      )}
    </div>
  );
}

async function VistaPorDia({
  supabase,
  dia,
  hoy,
  profileId,
  puedeCargar,
  dictaClases,
  soloMias,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  dia: string;
  hoy: string;
  profileId: string;
  puedeCargar: boolean;
  dictaClases: boolean;
  soloMias: boolean;
}) {
  const [todas, pendiente] = await Promise.all([
    clasesPlanificadasDelDia(supabase, dia, profileId),
    puedeCargar ? planificacionesQueMeFaltan(supabase, dia, profileId) : Promise.resolve(null),
  ]);

  const clases = soloMias ? todas.filter((c) => c.esMia) : todas;
  const numero = Number(dia.slice(8, 10));
  const titulo = `${nombreDia(diaIsoDeFecha(dia))} ${numero}`;

  const filtro =
    "rounded-full px-3 py-1 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

  return (
    <>
      <TiraDeDias
        dias={diasDeLaSemana(dia)}
        seleccionado={dia}
        hoy={hoy}
        basePath="/horarios"
        sabadoInactivo={false}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {titulo}
          {dia === hoy && <span className="ml-2 text-sm font-normal text-text-subtle">Hoy</span>}
        </h2>

        {dictaClases && (
          <div className="flex gap-1 rounded-full border border-border p-0.5">
            <Link
              href={`/horarios?dia=${dia}&mias=1`}
              aria-current={soloMias ? "true" : undefined}
              className={`${filtro} ${
                soloMias ? "bg-primary-500 text-on-primary" : "text-text-muted hover:text-text"
              }`}
            >
              Mis clases
            </Link>
            <Link
              href={`/horarios?dia=${dia}&mias=0`}
              aria-current={soloMias ? undefined : "true"}
              className={`${filtro} ${
                soloMias ? "text-text-muted hover:text-text" : "bg-primary-500 text-on-primary"
              }`}
            >
              Todas
            </Link>
          </div>
        )}
      </div>

      {clases.length === 0 ? (
        <EmptyState
          mensaje={
            soloMias && todas.length > 0
              ? "No tenés clases este día. Tocá «Todas» para ver el resto de la pista."
              : "No hay clases este día."
          }
        />
      ) : (
        <>
          <ul className="space-y-3">
            {clases.map((clase) => (
              <ClaseDelDiaCard
                // Un grupo aparece una sola vez por día: la Preparación física
                // va dentro de su clase, no como tarjeta aparte. El `tipo`
                // sigue en la key porque una franja puede tener la física
                // cargada y el patín todavía no, y ahí la física va sola.
                key={`${clase.grupoId}-${clase.tipo}`}
                clase={clase}
                fecha={dia}
                puedeCargar={puedeCargar}
              />
            ))}
          </ul>

          {soloMias && clases.length === 1 && todas.length > 1 && (
            <p className="text-sm text-text-subtle">
              Es tu única clase de este día. Tocá «Todas» para ver el resto de la pista.
            </p>
          )}
        </>
      )}

      {pendiente && (
        <Link
          href={`/horarios?vista=grupo&mes=${dia.slice(0, 7)}`}
          className="flex items-center gap-3 rounded-xl border border-warning-300 bg-warning-50 px-4 py-3 transition-colors duration-[var(--duration-base)] ease-standard hover:border-warning-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <Icono nombre="note" className="h-5 w-5 flex-none text-warning-800" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-warning-800">
              Te {pendiente.faltan === 1 ? "falta 1 planificación" : `faltan ${pendiente.faltan} planificaciones`}
            </span>
            <span className="block truncate text-sm text-warning-800">
              {pendiente.grupoNombre} · {nombreMes(Number(dia.slice(5, 7))).toLowerCase()}
            </span>
          </span>
          <span aria-hidden="true" className="flex-none text-warning-800">
            ›
          </span>
        </Link>
      )}
    </>
  );
}

async function VistaPorGrupo({
  supabase,
  anio,
  mes,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  anio: number;
  mes: number;
}) {
  const grupos = await gruposDelMes(supabase, anio, mes);

  return (
    <>
      <NavegadorDeMes basePath="/horarios" anio={anio} mes={mes} extra={{ vista: "grupo" }} />

      {grupos.length === 0 ? (
        <EmptyState mensaje="Todavía no hay grupos cargados." />
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {grupos.map((grupo) => (
            <GrupoDelMesFila key={grupo.grupoId} grupo={grupo} mes={mesQuery(anio, mes)} />
          ))}
        </ul>
      )}
    </>
  );
}
