"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { darDeBajaAlumna, reactivarAlumna } from "@/app/(dashboard)/alumnas/actions";
import { Spinner } from "@/components/ui/spinner";

const CLASE_FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

/**
 * Dar de baja, fuera del formulario.
 *
 * Era un desplegable «Activa / Baja» adentro de «Editar», entre el grupo y los
 * contactos. Es la acción que apaga la alerta de inasistencia y la que decide
 * hasta cuándo se le cobra: tiene que ser **fácil de encontrar y difícil de
 * tocar sin querer**, así que vive acá arriba pero pide fecha y confirmación.
 */
export function AccionesAlumna({
  alumnaId,
  alumnaNombre,
  deBaja,
  fechaBaja,
  hoy,
}: {
  alumnaId: string;
  alumnaNombre: string;
  deBaja: boolean;
  fechaBaja: string | null;
  /** Calculado en el servidor con `hoyArgentina()`, nunca con `new Date()`. */
  hoy: string;
}) {
  const router = useRouter();
  const [paso, setPaso] = useState<"cerrado" | "confirmando">("cerrado");
  const [fecha, setFecha] = useState(fechaBaja ?? hoy);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  function confirmarBaja() {
    setError(null);
    iniciar(async () => {
      const resultado = await darDeBajaAlumna(alumnaId, fecha);
      if (resultado.error) {
        setError(resultado.error);
        return;
      }
      setPaso("cerrado");
      router.refresh();
    });
  }

  function volverAActivar() {
    setError(null);
    iniciar(async () => {
      const resultado = await reactivarAlumna(alumnaId);
      if (resultado.error) {
        setError(resultado.error);
        return;
      }
      router.refresh();
    });
  }

  if (deBaja) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={volverAActivar}
          disabled={pendiente}
          className={`flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:border-border-strong disabled:opacity-50 ${CLASE_FOCO}`}
        >
          {pendiente && <Spinner />}
          Volver a activarla
        </button>
        {error && (
          <p role="alert" className="text-sm text-error-600">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (paso === "cerrado") {
    return (
      <button
        type="button"
        onClick={() => setPaso("confirmando")}
        className={`rounded-lg px-3 py-2 text-sm font-medium text-text-subtle transition-colors duration-[var(--duration-fast)] ease-standard hover:text-error-600 ${CLASE_FOCO}`}
      >
        Dar de baja
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-error-200 bg-error-50 p-4">
      <p className="text-sm font-medium text-error-800">
        Dar de baja a {alumnaNombre}
      </p>
      <p className="mt-1 text-sm text-error-800/80">
        Sale de los listados y deja de contar para la alerta de inasistencia.{" "}
        <strong>La deuda no se borra:</strong> si quedó debiendo, sigue en Deudores hasta el mes
        de la baja.
      </p>

      <label htmlFor="fecha-baja" className="mt-3 block text-sm font-medium text-error-800">
        ¿Desde cuándo?
      </label>
      <input
        id="fecha-baja"
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className={`mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm ${CLASE_FOCO}`}
      />
      <p className="mt-1 text-sm text-error-800/80">
        Hasta ese mes inclusive se le sigue cobrando la cuota.
      </p>

      {error && (
        <p role="alert" className="mt-2 text-sm text-error-700">
          {error}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={confirmarBaja}
          disabled={pendiente || !fecha}
          className={`flex items-center gap-2 rounded-md bg-error-600 px-4 py-2 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-error-700 disabled:cursor-not-allowed disabled:opacity-50 ${CLASE_FOCO}`}
        >
          {pendiente && <Spinner />}
          {pendiente ? "Guardando..." : "Confirmar la baja"}
        </button>
        <button
          type="button"
          onClick={() => {
            setPaso("cerrado");
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
