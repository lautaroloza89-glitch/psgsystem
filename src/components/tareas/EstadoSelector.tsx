"use client";

import { useState, useTransition } from "react";
import type { EstadoTarea } from "@/types";
import { actualizarEstadoTarea } from "@/app/(dashboard)/tareas/actions";
import { Spinner } from "@/components/ui/spinner";

const ESTADOS: EstadoTarea[] = ["Pendiente", "En progreso", "Completada"];

export function EstadoSelector({
  tareaId,
  estadoActual,
}: {
  tareaId: string;
  estadoActual: EstadoTarea;
}) {
  const [estado, setEstado] = useState(estadoActual);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(nuevoEstado: EstadoTarea) {
    setEstado(nuevoEstado);
    setError(null);
    startTransition(async () => {
      const result = await actualizarEstadoTarea(tareaId, nuevoEstado);
      if (result.error) {
        setError(result.error);
        setEstado(estadoActual);
      }
    });
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <label htmlFor="estado" className="text-label font-medium">
          Estado
        </label>
        {pending && <Spinner className="h-3.5 w-3.5 text-text-subtle" />}
      </div>
      <select
        id="estado"
        value={estado}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value as EstadoTarea)}
        className="w-full rounded-md border border-border-strong px-3 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        {ESTADOS.map((opcion) => (
          <option key={opcion} value={opcion}>
            {opcion}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" aria-live="assertive" className="text-sm text-error-600">
          {error}
        </p>
      )}
    </div>
  );
}
