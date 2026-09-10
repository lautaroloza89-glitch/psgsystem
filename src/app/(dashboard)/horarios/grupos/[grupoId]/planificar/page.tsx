import type { Metadata } from "next";
import { PantallaPlanificar } from "@/components/horarios/PantallaPlanificar";
import { mesQuery } from "@/lib/utils/date";
import { anioMesDeHoy } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Nueva planificación" };

/** Entrada desde un grupo: el chip de grupo viene preseleccionado. */
export default async function PlanificarDeGrupoPage({
  params,
  searchParams,
}: {
  params: Promise<{ grupoId: string }>;
  searchParams: Promise<{ mes?: string; fecha?: string; tipo?: string }>;
}) {
  const { grupoId } = await params;
  const { mes, fecha, tipo } = await searchParams;

  const hoyAM = anioMesDeHoy();
  const mesVolver = mes ?? mesQuery(hoyAM.anio, hoyAM.mes);

  return (
    <PantallaPlanificar
      grupoIdInicial={grupoId}
      mesParam={mes}
      fechaParam={fecha}
      tipoParam={tipo}
      volverA={`/horarios/grupos/${grupoId}?mes=${mesVolver}`}
    />
  );
}
