"use client";

import { useState, useTransition } from "react";
import type { EstadoTarea } from "@/types";
import { actualizarEstadoTarea } from "@/app/(dashboard)/tareas/actions";

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
      <label htmlFor="estado" className="text-sm font-medium">
        Estado
      </label>
      <select
        id="estado"
        value={estado}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value as EstadoTarea)}
        className="w-full rounded-md border border-border-strong px-3 py-2.5 text-sm disabled:opacity-50"
      >
        {ESTADOS.map((opcion) => (
          <option key={opcion} value={opcion}>
            {opcion}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-error-600">{error}</p>}
    </div>
  );
}
