"use client";

import { useState, useTransition } from "react";
import type { EstadoTurno } from "@/types";
import { actualizarEstadoTurno } from "@/app/(dashboard)/horarios/actions";

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
        className={`rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50 ${
          estado === "Activo"
            ? "border-error-200 text-error-700 hover:border-error-400"
            : "border-success-200 text-success-700 hover:border-success-400"
        }`}
      >
        {pending
          ? "Guardando..."
          : estado === "Activo"
            ? "Cancelar turno"
            : "Reactivar turno"}
      </button>
      {error && <p className="text-sm text-error-600">{error}</p>}
    </div>
  );
}
