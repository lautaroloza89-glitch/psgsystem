import type { Metadata } from "next";
import { PantallaPlanificar } from "@/components/horarios/PantallaPlanificar";
import { anioMesDeHoy, mesQuery } from "@/lib/utils/date";

export const metadata: Metadata = { title: "Nueva planificación" };

/**
 * Entrada desde el botón «+ Nueva» de la pestaña «Por grupo», sin ningún grupo
 * elegido todavía: se elige adentro, con los chips.
 */
export default async function PlanificarPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;

  const hoyAM = anioMesDeHoy();
  const mesVolver = mes ?? mesQuery(hoyAM.anio, hoyAM.mes);

  return <PantallaPlanificar mesParam={mes} volverA={`/horarios?vista=grupo&mes=${mesVolver}`} />;
}
