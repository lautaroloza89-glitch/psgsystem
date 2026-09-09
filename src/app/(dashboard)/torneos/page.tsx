import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeGestionarTorneos, puedeVerTorneos } from "@/lib/permisos";
import { hoyArgentina } from "@/lib/utils/date";
import { agruparPorMes, repartirTorneos, type GrupoDeMes } from "@/lib/torneos/agrupar";
import type { Torneo } from "@/types";
import { TorneoFila } from "@/components/torneos/TorneoFila";
import { TorneoDestacado } from "@/components/torneos/TorneoDestacado";
import { FiltroAnioTorneos } from "@/components/torneos/FiltroAnioTorneos";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icono } from "@/components/ui/Icono";

export const metadata: Metadata = { title: "Torneos" };

type TorneoDeLista = Pick<
  Torneo,
  "id" | "nombre" | "tipo" | "lugar" | "fecha_inicio" | "fecha_fin" | "notas"
>;

export default async function TorneosPage({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string; anio?: string }>;
}) {
  const profile = await getCurrentUserProfile();
  if (!puedeVerTorneos(profile)) {
    redirect("/dashboard");
  }

  const { ver, anio: anioParam } = await searchParams;
  const verPasados = ver === "pasados";

  const hoy = hoyArgentina();
  const supabase = await createClient();
  const { data: torneosData } = await supabase
    .from("torneos")
    .select("id, nombre, tipo, lugar, fecha_inicio, fecha_fin, notas")
    .order("fecha_inicio", { ascending: true });

  const torneos = (torneosData ?? []) as TorneoDeLista[];
  const puedeEditar = puedeGestionarTorneos(profile);

  const { proximos, pasados } = repartirTorneos(torneos, hoy);

  const aniosPasados = [...new Set(pasados.map((t) => Number(t.fecha_inicio.slice(0, 4))))].sort(
    (a, b) => b - a
  );
  const anioElegido =
    anioParam && aniosPasados.includes(Number(anioParam))
      ? Number(anioParam)
      : (aniosPasados[0] ?? Number(hoy.slice(0, 4)));

  const pasadosDelAnio = pasados.filter(
    (t) => t.fecha_inicio.slice(0, 4) === String(anioElegido)
  );

  // El destacado encabeza y no se vuelve a listar: antes aparecía dos veces,
  // en la tarjeta de arriba y en la primera fila del año.
  const destacado = proximos[0] ?? null;
  const restoProximos = proximos.slice(1);

  const tab =
    "flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Torneos</h1>
        {puedeEditar && (
          <Link
            href="/torneos/nuevo"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md bg-primary-500 px-4 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <Icono nombre="plus" className="h-4 w-4" />
            Nuevo
          </Link>
        )}
      </div>

      <nav aria-label="Próximos o pasados">
        <div className="flex gap-1 rounded-xl border border-border bg-surface-muted p-1">
          <Link
            href="/torneos"
            aria-current={verPasados ? undefined : "page"}
            className={`${tab} ${verPasados ? "text-text-muted hover:text-text" : "bg-surface text-text shadow-xs"}`}
          >
            Próximos{proximos.length > 0 ? ` · ${proximos.length}` : ""}
          </Link>
          <Link
            href="/torneos?ver=pasados"
            aria-current={verPasados ? "page" : undefined}
            className={`${tab} ${verPasados ? "bg-surface text-text shadow-xs" : "text-text-muted hover:text-text"}`}
          >
            Pasados
          </Link>
        </div>
      </nav>

      {verPasados ? (
        pasados.length === 0 ? (
          <EmptyState mensaje="Todavía no hay eventos pasados." />
        ) : (
          <>
            {/* El año no desaparece: se mueve acá, que es el único lugar
                donde importa. En Próximos siempre es este año o el que viene. */}
            <FiltroAnioTorneos anios={aniosPasados} anioActual={anioElegido} />

            {pasadosDelAnio.length === 0 ? (
              <EmptyState mensaje={`No hay eventos cargados en ${anioElegido}.`} />
            ) : (
              <ListaPorMes grupos={agruparPorMes(pasadosDelAnio)} hoy={hoy} />
            )}
          </>
        )
      ) : proximos.length === 0 ? (
        <EmptyState mensaje="No hay eventos próximos en el calendario." />
      ) : (
        <>
          {destacado && (
            <TorneoDestacado torneo={destacado} hoy={hoy} puedeEditar={puedeEditar} />
          )}
          {restoProximos.length > 0 && <ListaPorMes grupos={agruparPorMes(restoProximos)} hoy={hoy} />}
        </>
      )}
    </div>
  );
}

function ListaPorMes({
  grupos,
  hoy,
}: {
  grupos: GrupoDeMes<TorneoDeLista>[];
  hoy: string;
}) {
  return (
    <div className="space-y-5">
      {grupos.map((grupo) => (
        <section key={grupo.clave} className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-subtle">
            {grupo.titulo}
          </h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {grupo.items.map((torneo) => (
              <TorneoFila key={torneo.id} torneo={torneo} hoy={hoy} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
