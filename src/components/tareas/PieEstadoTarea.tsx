"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { actualizarEstadoTarea } from "@/app/(dashboard)/tareas/actions";
import type { EstadoTarea } from "@/types";

/**
 * El desplegable de estado se vuelve un pie con dos botones.
 *
 * El componente solo se monta si el rol puede cambiar el estado — antes el
 * selector se mostraba a todos y la action ni siquiera consultaba el perfil,
 * así que una patinadora podía completar la tarea de otra persona. Eso se
 * cerró en el Bloque 1; acá la UI se alinea con esa regla.
 */
export function PieEstadoTarea({
  tareaId,
  estado,
}: {
  tareaId: string;
  estado: EstadoTarea;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function cambiar(nuevo: EstadoTarea) {
    setError(null);
    startTransition(async () => {
      const resultado = await actualizarEstadoTarea(tareaId, nuevo);
      if (resultado.error) {
        setError(resultado.error);
        return;
      }
      router.refresh();
    });
  }

  const completada = estado === "Completada";

  return (
    <div className="sticky bottom-0 -mx-4 border-t border-border bg-surface px-4 py-3 sm:-mx-8 sm:px-8">
      {error && (
        <p role="alert" className="pb-2 text-sm text-error-600">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pendiente}
          onClick={() => cambiar(completada ? "Pendiente" : "Completada")}
          className="flex-1 rounded-md bg-primary-500 px-4 py-2.5 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          {completada ? "Reabrir" : "Marcar hecha"}
        </button>

        {!completada && (
          <button
            type="button"
            disabled={pendiente}
            onClick={() => cambiar(estado === "En progreso" ? "Pendiente" : "En progreso")}
            className="rounded-md border border-border-strong px-4 py-2.5 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {estado === "En progreso" ? "Pausar" : "Empecé"}
          </button>
        )}
      </div>
    </div>
  );
}
