import Link from "next/link";
import type { GrupoDelMes } from "@/lib/horarios/dia";
import { ChipObjetivoMes } from "./ChipObjetivoMes";

/**
 * Un grupo en el mes elegido. La lista de grupos eran cinco nombres sueltos:
 * ni qué día tocaba, ni si ya había algo cargado. Acá cada fila dice dónde
 * queda trabajo pendiente sin tener que entrar a mirar.
 */
function textoCarga(grupo: GrupoDelMes): string {
  if (grupo.totalFechas === 0) return "Sin horario cargado";
  if (grupo.cargadas === 0) return "sin cargar";
  if (grupo.cargadas === grupo.totalFechas) {
    return `${grupo.totalFechas} ${grupo.totalFechas === 1 ? "clase cargada" : "clases cargadas"}`;
  }
  return `${grupo.cargadas} de ${grupo.totalFechas} cargadas`;
}

export function GrupoDelMesFila({ grupo, mes }: { grupo: GrupoDelMes; mes: string }) {
  const completo = grupo.totalFechas > 0 && grupo.cargadas === grupo.totalFechas;

  return (
    <li className="space-y-2 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold">
            <Link
              href={`/horarios/grupos/${grupo.grupoId}?mes=${mes}`}
              className="hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              {grupo.grupoNombre}
              <span aria-hidden="true" className="ml-1.5 text-text-subtle">
                ›
              </span>
            </Link>
          </h3>
          <p className="text-sm text-text-subtle">
            {grupo.totalFechas === 0 ? (
              textoCarga(grupo)
            ) : (
              <>
                {grupo.diasLabel} ·{" "}
                <span className={completo ? "" : "font-medium text-warning-800"}>
                  {textoCarga(grupo)}
                </span>
              </>
            )}
          </p>
        </div>
      </div>
      <ChipObjetivoMes objetivo={grupo.objetivoDelMes} />
    </li>
  );
}
