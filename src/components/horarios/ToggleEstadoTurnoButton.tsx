"use client";

import { useState, useTransition } from "react";
import type { EstadoTurno } from "@/types";
import { actualizarEstadoTurno } from "@/app/(dashboard)/horarios/actions";
import { Spinner } from "@/components/ui/spinner";

export function ToggleEstadoTurnoButton({
  turnoId,
  estadoActual,
}: {
  turnoId: string;
  estadoActual: EstadoTurno;
}) {
  const [estado, setEstado] = useState(estadoActual);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const nuevoEstado: EstadoTurno = estado === "Activo" ? "Cancelado" : "Activo";
    setError(null);
    startTransition(async () => {
      const result = await actualizarEstadoTurno(turnoId, nuevoEstado);
      if (result.error) {
        setError(result.error);
      } else {
        setEstado(nuevoEstado);
      }
    });
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
          estado === "Activo"
            ? "border-warning-200 text-warning-700 hover:border-warning-400 hover:bg-warning-50 active:bg-warning-100"
            : "border-success-200 text-success-700 hover:border-success-400 hover:bg-success-50 active:bg-success-100"
        }`}
      >
        {pending && <Spinner className="h-4 w-4" />}
        {pending
          ? "Guardando..."
          : estado === "Activo"
            ? "Cancelar clase"
            : "Reactivar clase"}
      </button>
      {error && (
        <p role="alert" aria-live="assertive" className="text-sm text-error-600">
          {error}
        </p>
      )}
    </div>
  );
}
