import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { BackButton } from "@/components/ui/BackButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { puedeGestionarAsistencia } from "@/lib/asistencia/permisos";
import { fechasDeClaseDelMes } from "@/lib/asistencia/fechas";
import { leerAsistenciaDelRango } from "@/lib/asistencia/consultas";
import {
  formatFecha,
  hoyArgentina,
  mesAnteriorSiguiente,
  mesQuery,
  nombreDia,
  nombreMes,
  diaIsoDeFecha,
} from "@/lib/utils/date";

export const metadata: Metadata = { title: "Asistencia del grupo" };

interface ResumenFecha {
  fecha: string;
  cargada: boolean;
  presentes: number;
  total: number;
}

export default async function AsistenciaGrupoPage({
  params,
  searchParams,
}: {
  params: Promise<{ grupoId: string }>;
  searchParams: Promise<{ mes?: string; guardada?: string }>;
}) {
  const profile = await getCurrentUserProfile();
  if (!profile || !puedeGestionarAsistencia(profile.rol)) {
    redirect("/dashboard");
  }

  const { grupoId } = await params;
  const { mes: mesParam, guardada } = await searchParams;

  const hoy = hoyArgentina();
  let anio = Number(hoy.slice(0, 4));
  let mes = Number(hoy.slice(5, 7));
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

  // Nunca incluye sábados, ni siquiera para Jungla (que sí tiene bloque de
  // sábado): de ese bloque no se toma asistencia.
  const fechas = fechasDeClaseDelMes(grupo.grupo_horarios ?? [], anio, mes);
  const { anterior, siguiente } = mesAnteriorSiguiente(anio, mes);

  const filas =
    fechas.length > 0
      ? await leerAsistenciaDelRango(supabase, fechas[0], fechas[fechas.length - 1], grupoId)
      : [];

  const conteoPorFecha = new Map<string, { presentes: number; total: number }>();
  for (const fila of filas) {
    const actual = conteoPorFecha.get(fila.fecha) ?? { presentes: 0, total: 0 };
    actual.total++;
    if (fila.presente) actual.presentes++;
    conteoPorFecha.set(fila.fecha, actual);
  }

  const resumen: ResumenFecha[] = fechas.map((fecha) => {
    const conteo = conteoPorFecha.get(fecha);
    return {
      fecha,
      cargada: !!conteo,
      presentes: conteo?.presentes ?? 0,
      total: conteo?.total ?? 0,
    };
  });

  const pendientes = resumen.filter((r) => !r.cargada && r.fecha <= hoy).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton href="/asistencia" />
      <h1 className="text-2xl font-bold tracking-tight">{grupo.nombre}</h1>

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2.5">
        <Link
          href={`/asistencia/grupos/${grupoId}?mes=${mesQuery(anterior.anio, anterior.mes)}`}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          ← Anterior
        </Link>
        <span className="text-sm font-semibold">
          {nombreMes(mes)} {anio}
        </span>
        <Link
          href={`/asistencia/grupos/${grupoId}?mes=${mesQuery(siguiente.anio, siguiente.mes)}`}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Siguiente →
        </Link>
      </div>

      {guardada && /^\d{4}-\d{2}-\d{2}$/.test(guardada) && (
        <div
          role="status"
          className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm font-medium text-success-800"
        >
          Asistencia del {formatFecha(guardada)} guardada.
        </div>
      )}

      {resumen.length === 0 ? (
        <EmptyState
          mensaje="Este grupo no tiene días de clase de lunes a viernes configurados, así que no hay fechas para tomar asistencia."
        />
      ) : (
        <>
          <p className="text-sm text-text-subtle">
            {pendientes === 0
              ? "No quedan fechas pendientes en este mes."
              : `${pendientes} ${pendientes === 1 ? "fecha pendiente" : "fechas pendientes"} de cargar en este mes.`}
          </p>

          <ul className="space-y-2">
            {resumen.map((item) => {
              const futura = item.fecha > hoy;
              return (
                <li key={item.fecha}>
                  <Link
                    href={`/asistencia/grupos/${grupoId}/${item.fecha}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 shadow-xs transition duration-[var(--duration-base)] ease-standard hover:border-border-strong hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {nombreDia(diaIsoDeFecha(item.fecha))} {formatFecha(item.fecha)}
                      </p>
                      <p className="mt-0.5 text-sm text-text-subtle">
                        {item.cargada
                          ? `${item.presentes} de ${item.total} presentes`
                          : futura
                            ? "Todavía no fue la clase"
                            : "Sin cargar"}
                      </p>
                    </div>
                    {item.cargada ? (
                      <span
                        className="shrink-0 rounded-full bg-success-50 px-2.5 py-1 text-sm font-medium text-success-700"
                        title="Asistencia cargada"
                      >
                        <span aria-hidden="true">✓</span>{" "}
                        <span className="sr-only sm:not-sr-only">Cargada</span>
                      </span>
                    ) : (
                      !futura && (
                        <span className="shrink-0 rounded-full bg-warning-50 px-2.5 py-1 text-sm font-medium text-warning-800">
                          Pendiente
                        </span>
                      )
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
