import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icono } from "@/components/ui/Icono";
import { TiraDeDias } from "@/components/asistencia/TiraDeDias";
import { puedeGestionarAsistencia } from "@/lib/asistencia/permisos";
import { clasesDelDia, diasDeLaSemana, fechasAtrasadas, type ClaseDelDia } from "@/lib/asistencia/dia";
import { calcularAlertasInasistencia, SEMANAS_PARA_ALERTA } from "@/lib/asistencia/alertas";
import { diaIsoDeFecha, hoyArgentina, nombreDia, nombreMes, sumarDias } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Asistencia" };

/**
 * El día de asistencia, no el menú del módulo.
 *
 * Antes hacían falta tres pantallas para decir «Gladiadores, hoy» (menú →
 * grupo → fecha) y recién en la cuarta se podía tildar a alguien. Acá la
 * semana está arriba, las clases del día abajo con su estado, y la que falta
 * cargar tiene el botón puesto: un toque.
 */

function hhmm(hora: string): string {
  return hora.slice(0, 5);
}

function enPlural(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** «Viernes 4 de septiembre», con «Hoy» adelante cuando corresponde. */
function tituloDelDia(fecha: string, hoy: string): string {
  const [, mes, dia] = fecha.split("-").map(Number);
  const largo = `${nombreDia(diaIsoDeFecha(fecha))} ${dia} de ${nombreMes(mes).toLowerCase()}`;
  if (fecha === hoy) return `Hoy · ${largo}`;
  if (fecha === sumarDias(hoy, -1)) return `Ayer · ${largo}`;
  return largo;
}

function ClasePendiente({ clase, fecha, futura }: { clase: ClaseDelDia; fecha: string; futura: boolean }) {
  return (
    <li className="rounded-xl border border-border bg-surface p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold leading-snug">{clase.grupoNombre}</p>
          <p className="mt-0.5 text-sm text-text-subtle">
            {hhmm(clase.horaInicio)}–{hhmm(clase.horaFin)} ·{" "}
            {enPlural(clase.totalAlumnas, "alumna", "alumnas")}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-warning-50 px-2.5 py-1 text-sm font-medium text-warning-800">
          {futura ? "Próxima" : "Pendiente"}
        </span>
      </div>

      {futura ? (
        <p className="mt-3 text-sm text-text-subtle">Todavía no fue la clase.</p>
      ) : (
        <Link
          href={`/asistencia/grupos/${clase.grupoId}/${fecha}`}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-primary-500 py-2.5 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <Icono nombre="check-square" className="h-4 w-4" />
          Tomar asistencia
        </Link>
      )}
    </li>
  );
}

/**
 * Las ya resueltas colapsan a una fila con su número: parcial en ámbar,
 * completa en verde. Siguen siendo tocables, que es como se corrige.
 */
function ClaseResuelta({ clase, fecha }: { clase: ClaseDelDia; fecha: string }) {
  const parcial = clase.estado === "parcial";

  return (
    <li>
      <Link
        href={`/asistencia/grupos/${clase.grupoId}/${fecha}`}
        className="flex items-center justify-between gap-3 px-4 py-3 transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
      >
        <span className="min-w-0">
          <span className="block font-medium leading-snug">{clase.grupoNombre}</span>
          <span className="block text-sm text-text-subtle">
            {hhmm(clase.horaInicio)}
            {clase.cargadaPor && (
              <> · {parcial ? "empezada" : "cargada"} por {clase.cargadaPor}</>
            )}
          </span>
        </span>
        <span
          className={
            parcial
              ? "shrink-0 rounded-full bg-warning-50 px-2.5 py-1 text-sm font-medium tabular-nums text-warning-800"
              : "shrink-0 rounded-full bg-success-50 px-2.5 py-1 text-sm font-medium tabular-nums text-success-700"
          }
        >
          {clase.marcadas} de {clase.totalAlumnas}
        </span>
      </Link>
    </li>
  );
}

export default async function AsistenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string; guardada?: string }>;
}) {
  const profile = await getCurrentUserProfile();
  if (!profile || !puedeGestionarAsistencia(profile.rol)) {
    redirect("/dashboard");
  }

  const { dia: diaParam, guardada } = await searchParams;
  const hoy = hoyArgentina();
  const dia = diaParam && /^\d{4}-\d{2}-\d{2}$/.test(diaParam) ? diaParam : hoy;
  const semana = diasDeLaSemana(dia);

  const supabase = await createClient();
  const [clases, alertas, atrasadas] = await Promise.all([
    clasesDelDia(supabase, dia),
    calcularAlertasInasistencia(supabase),
    fechasAtrasadas(supabase, hoy),
  ]);

  const futura = dia > hoy;
  const pendientes = clases.filter((c) => c.estado === "pendiente");
  const resueltas = clases.filter((c) => c.estado === "parcial" || c.estado === "cargada");
  const sinAlumnas = clases.filter((c) => c.estado === "sin-alumnas");

  // La del día que se está mirando ya se ve arriba: al pie van las otras.
  const atrasadasDeOtroDia = atrasadas.filter((a) => a.fecha !== dia);
  const masVieja = atrasadasDeOtroDia[0];

  // La confirmación de guardado aparece sobre la pantalla del día, que es a
  // donde vuelve el formulario.
  const guardadaEn = guardada ? clases.find((c) => c.grupoId === guardada) : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight">Asistencia</h1>
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/asistencia?dia=${sumarDias(semana[0], -7)}`}
            aria-label="Semana anterior"
            className="rounded px-2 py-1 text-sm font-medium text-primary-600 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            ← Semana
          </Link>
          {dia !== hoy && (
            <Link
              href="/asistencia"
              className="rounded px-2 py-1 text-sm font-medium text-primary-600 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Volver a hoy
            </Link>
          )}
          <Link
            href={`/asistencia?dia=${sumarDias(semana[0], 7)}`}
            aria-label="Semana siguiente"
            className="rounded px-2 py-1 text-sm font-medium text-primary-600 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Semana →
          </Link>
        </div>
        <TiraDeDias dias={semana} seleccionado={dia} hoy={hoy} />
      </div>

      {guardadaEn && (
        <div
          role="status"
          className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm font-medium text-success-800"
        >
          Asistencia de {guardadaEn.grupoNombre} guardada
          {guardadaEn.estado === "parcial" && (
            <> — quedan {guardadaEn.totalAlumnas - guardadaEn.marcadas} sin marcar</>
          )}
          .
        </div>
      )}

      <section aria-labelledby="clases-del-dia" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="clases-del-dia" className="text-base font-semibold">
            {tituloDelDia(dia, hoy)}
          </h2>
          {clases.length > 0 && (
            <span className="text-sm text-text-subtle">
              {enPlural(clases.length, "clase", "clases")}
            </span>
          )}
        </div>

        {clases.length === 0 ? (
          <EmptyState
            mensaje={
              diaIsoDeFecha(dia) === 6
                ? "Los sábados no se toma asistencia."
                : "Ningún grupo tiene clase este día."
            }
          />
        ) : (
          <>
            {pendientes.length > 0 && (
              <ul className="space-y-3">
                {pendientes.map((clase) => (
                  <ClasePendiente key={clase.grupoId} clase={clase} fecha={dia} futura={futura} />
                ))}
              </ul>
            )}

            {resueltas.length > 0 && (
              <ul className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
                {resueltas.map((clase) => (
                  <ClaseResuelta key={clase.grupoId} clase={clase} fecha={dia} />
                ))}
              </ul>
            )}

            {sinAlumnas.length > 0 && (
              <p className="text-sm text-text-subtle">
                {sinAlumnas.map((c) => c.grupoNombre).join(", ")}:{" "}
                {sinAlumnas.length === 1 ? "no tiene" : "no tienen"} alumnas activas.
              </p>
            )}
          </>
        )}
      </section>

      {/* Al pie, donde no compite con lo del día: lo que hay que atender pero
          no es «cargar la clase de ahora». */}
      <section aria-label="Para revisar" className="space-y-3">
        {atrasadasDeOtroDia.length > 0 && masVieja && (
          <Link
            href={`/asistencia?dia=${masVieja.fecha}`}
            className="flex items-start gap-3 rounded-xl border border-warning-200 bg-warning-50 p-4 transition-colors duration-[var(--duration-fast)] ease-standard hover:border-warning-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <Icono nombre="check-square" className="mt-0.5 h-5 w-5 shrink-0 text-warning-800" />
            <span>
              <span className="block font-medium text-warning-800">
                {enPlural(atrasadasDeOtroDia.length, "fecha sin cargar", "fechas sin cargar")}
              </span>
              <span className="block text-sm text-warning-800/80">
                {masVieja.grupoNombre} · {nombreDia(diaIsoDeFecha(masVieja.fecha)).toLowerCase()}{" "}
                {Number(masVieja.fecha.slice(8, 10))} de{" "}
                {nombreMes(Number(masVieja.fecha.slice(5, 7))).toLowerCase()}
              </span>
            </span>
          </Link>
        )}

        {alertas.length > 0 && (
          <Link
            href="/asistencia/alertas"
            className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-colors duration-[var(--duration-fast)] ease-standard hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <Icono nombre="users-three" className="mt-0.5 h-5 w-5 shrink-0 text-text-subtle" />
            <span>
              <span className="block font-medium">
                {enPlural(alertas.length, "alumna", "alumnas")} con {SEMANAS_PARA_ALERTA} semanas
                sin venir
              </span>
              <span className="block text-sm text-text-subtle">Ver alertas</span>
            </span>
          </Link>
        )}

        <p className="text-sm text-text-subtle">
          ¿Buscás un mes viejo?{" "}
          <Link
            href="/asistencia/grupos"
            className="rounded font-medium text-primary-600 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Ver por grupo
          </Link>
        </p>
      </section>
    </div>
  );
}
