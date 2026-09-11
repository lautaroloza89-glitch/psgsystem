import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { puedeGestionarPagos, puedeVerRecaudacion } from "@/lib/permisos";
import { BackButton } from "@/components/ui/BackButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { NavegadorDeMes } from "@/components/pagos/NavegadorDeMes";
import { TarjetaDeudora } from "@/components/pagos/TarjetaDeudora";
import { BuscadorAlumnas, FiltroAlumnas, ListaFiltrada } from "@/components/alumnas/FiltroAlumnas";
import { calcularDeudorasDelMes } from "@/lib/pagos/saldo";
import { esDiaDeRecordatorio, mesActualISO } from "@/lib/pagos/reglas";
import { formatMonto } from "@/lib/utils/money";
import { anioMesDeHoy, mesQuery, nombreMes, primerDiaDeMes } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Deudores" };

/**
 * La pantalla que se mira antes de hablar con una madre.
 *
 * Los dos arreglos de fondo: el recargo deja de estar escondido dentro del
 * monto (se explica arriba y se desglosa en cada línea), y «X días de atraso»
 * deja de repetirse igual en todas las filas — sale del mes, no de la alumna,
 * así que va una sola vez en el encabezado. En su lugar, cada línea dice **por
 * qué** debe.
 *
 * Una sola lista y una sola tarjeta (`TarjetaDeudora`) para todas, en orden
 * alfabético y con las bajas al final: el orden lo decide
 * `calcularDeudorasDelMes` y el buscador solo oculta filas, no las reordena.
 *
 * La pantalla se titula «Deudores» (2026-09-10): quien debe es la familia, no
 * la alumna. La ruta `/pagos/deudoras` y los identificadores del dominio
 * (`Deudora`, `calcularDeudorasDelMes`) siguen en femenino a propósito, igual
 * que la tabla `alumnas` sobre la que se calculan — renombrarlos cambiaría
 * enlaces ya guardados sin cambiar nada de lo que se ve.
 */
export default async function DeudorasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const profile = await getCurrentUserProfile();
  if (!puedeGestionarPagos(profile)) {
    redirect("/dashboard");
  }

  const { mes: mesParam } = await searchParams;
  const hoyAM = anioMesDeHoy();
  let anio = hoyAM.anio;
  let mes = hoyAM.mes;
  if (mesParam && /^\d{4}-\d{2}$/.test(mesParam)) {
    const [y, m] = mesParam.split("-").map(Number);
    anio = y;
    mes = m;
  }
  const mesISO = primerDiaDeMes(anio, mes);
  const mesParaLinks = mesQuery(anio, mes);

  const supabase = await createClient();
  const { deudoras, totalAdeudado, diasAtraso, recargoAplicado } = await calcularDeudorasDelMes(
    supabase,
    mesISO
  );

  // Mismo criterio que la entrada del módulo: la Secretaria ve el monto de
  // cada alumna (lo necesita para cobrar) pero no el agregado del club.
  const conTotales = puedeVerRecaudacion(profile);
  const mostrarBanner = mesISO === mesActualISO() && esDiaDeRecordatorio();
  const hayBajas = deudoras.some((d) => d.deBaja);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackButton href={`/pagos?mes=${mesParaLinks}`} />

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Deudores</h1>
        <p className="text-sm text-text-subtle">
          {nombreMes(mes)} ·{" "}
          {deudoras.length === 0
            ? "ninguna debe"
            : `${deudoras.length} ${deudoras.length === 1 ? "alumna" : "alumnas"}`}
          {conTotales && deudoras.length > 0 && ` · ${formatMonto(totalAdeudado)}`}
          {diasAtraso > 0 && ` · ${diasAtraso} ${diasAtraso === 1 ? "día" : "días"} de atraso`}
        </p>
      </div>

      <NavegadorDeMes basePath="/pagos/deudoras" anio={anio} mes={mes} />

      {mostrarBanner && (
        <div className="rounded-xl border border-warning-200 bg-warning-50 px-4 py-3">
          <p className="text-sm font-medium text-warning-800">
            Quedan 2 días antes del recargo — {deudoras.length}{" "}
            {deudoras.length === 1 ? "alumna sin pagar" : "alumnas sin pagar"}.
          </p>
        </div>
      )}

      {/* El recargo se explica una vez, arriba, en vez de estar sumado y mudo
          dentro de cada monto. */}
      {recargoAplicado && deudoras.length > 0 && (
        <p className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm">
          Pasó el día 10: los montos incluyen el recargo de{" "}
          {formatMonto(deudoras[0].recargo)}.
        </p>
      )}

      {deudoras.length === 0 ? (
        <EmptyState mensaje="Ninguna alumna tiene saldo pendiente este mes." />
      ) : (
        <FiltroAlumnas>
          <BuscadorAlumnas />
          <ListaFiltrada
            className="space-y-2"
            items={deudoras.map((d) => ({
              clave: d.alumnaId,
              apellido: d.apellido,
              nombre: d.nombre,
              // Solo se rotula el tramo de las bajas: si no hay, la lista es
              // una sola, sin subtítulos.
              seccion: hayBajas ? (d.deBaja ? "De baja" : "Activas") : undefined,
              fila: (
                <TarjetaDeudora
                  d={d}
                  mes={mesParaLinks}
                  mesNombre={nombreMes(mes).toLowerCase()}
                />
              ),
            }))}
          />
        </FiltroAlumnas>
      )}
    </div>
  );
}
