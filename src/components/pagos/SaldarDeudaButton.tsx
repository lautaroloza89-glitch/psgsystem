"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saldarDeuda } from "@/app/(dashboard)/pagos/actions";
import { Spinner } from "@/components/ui/spinner";

const CLASE_FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

/**
 * Sacar a una alumna de Deudoras sin cobrarle.
 *
 * «Eliminar de la lista» y «marcar como saldada» son la misma acción, con
 * motivo obligatorio — si fueran dos, en tres meses nadie recordaría qué
 * significaba cada una. No toca `pagos`: la recaudación del mes no se altera,
 * a diferencia de la salida que había hasta ahora, que era inventar un pago
 * falso.
 */
export function SaldarDeudaButton({
  alumnaId,
  alumnaNombre,
  mes,
}: {
  alumnaId: string;
  alumnaNombre: string;
  /** `YYYY-MM` */
  mes: string;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  function confirmar() {
    setError(null);
    iniciar(async () => {
      const resultado = await saldarDeuda(alumnaId, mes, motivo);
      if (resultado.error) {
        setError(resultado.error);
        return;
      }
      setAbierto(false);
      setMotivo("");
      router.refresh();
    });
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={`rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-subtle transition-colors duration-[var(--duration-fast)] ease-standard hover:border-border-strong hover:text-text ${CLASE_FOCO}`}
      >
        Saldar sin cobrar
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-border bg-surface-muted p-3">
      <label htmlFor={`motivo-${alumnaId}`} className="block text-sm font-medium">
        ¿Por qué se salda el mes de {alumnaNombre}?
      </label>
      <p className="mt-0.5 text-sm text-text-subtle">
        Sale de la lista sin registrar plata, así que la recaudación no cambia.
      </p>

      <input
        id={`motivo-${alumnaId}`}
        type="text"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Beca del club, se fue a mitad de mes…"
        autoFocus
        className={`mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm ${CLASE_FOCO}`}
      />

      {error && (
        <p role="alert" className="mt-2 text-sm text-error-600">
          {error}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={confirmar}
          disabled={pendiente || motivo.trim().length === 0}
          className={`flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50 ${CLASE_FOCO}`}
        >
          {pendiente && <Spinner />}
          {pendiente ? "Guardando..." : "Saldar el mes"}
        </button>
        <button
          type="button"
          onClick={() => {
            setAbierto(false);
            setError(null);
          }}
          disabled={pendiente}
          className={`rounded-md px-4 py-2 text-sm font-medium text-text-subtle hover:text-text ${CLASE_FOCO}`}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
