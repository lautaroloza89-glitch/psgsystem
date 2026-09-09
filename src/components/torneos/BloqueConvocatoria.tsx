import Link from "next/link";
import type { ResumenConvocatoria } from "@/lib/torneos/convocatoria";
import { Icono } from "@/components/ui/Icono";

/**
 * Las alumnas convocadas, en el detalle del torneo.
 *
 * Nada conectaba torneos con alumnas: quién participa y la inscripción paga
 * habían quedado fuera del alcance de F2 MOD 5. Este bloque es la puerta a las
 * dos pantallas nuevas.
 *
 * **La Profesora lo ve sin cifras de plata** (`verPlata`): necesita saber
 * quiénes van de su grupo, no quién pagó. Es un límite que la RLS no puede
 * expresar, así que se resuelve acá y en la consulta.
 */
export function BloqueConvocatoria({
  torneoId,
  resumen,
  puedeGestionar,
  verPlata,
}: {
  torneoId: string;
  resumen: ResumenConvocatoria;
  puedeGestionar: boolean;
  verPlata: boolean;
}) {
  const boton =
    "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-border-strong px-4 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:border-neutral-400 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface p-5 shadow-xs sm:p-6">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Alumnas convocadas</h2>
        <span className="text-2xl font-bold tabular-nums">{resumen.convocadas}</span>
      </div>

      {resumen.convocadas === 0 ? (
        <p className="text-sm text-text-subtle">
          Todavía no hay nadie en la lista de este torneo.
        </p>
      ) : (
        verPlata && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-surface-muted p-3">
              <p className="text-xl font-bold tabular-nums">{resumen.pagas}</p>
              <p className="text-sm text-text-subtle">inscripción paga</p>
            </div>
            <div
              className={`rounded-lg border p-3 ${
                resumen.sinPagar > 0
                  ? "border-warning-300 bg-warning-50"
                  : "border-border bg-surface-muted"
              }`}
            >
              <p className="text-xl font-bold tabular-nums">{resumen.sinPagar}</p>
              <p className="text-sm text-text-subtle">sin pagar</p>
            </div>
          </div>
        )
      )}

      <div className="flex flex-wrap gap-2">
        <Link href={`/torneos/${torneoId}/convocadas`} className={boton}>
          Ver la lista
        </Link>
        {puedeGestionar && (
          <Link
            href={`/torneos/${torneoId}/convocar`}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md bg-primary-500 px-4 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <Icono nombre="plus" className="h-4 w-4" />
            Convocar
          </Link>
        )}
      </div>
    </section>
  );
}
