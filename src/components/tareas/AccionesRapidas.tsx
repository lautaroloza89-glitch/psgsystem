"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { actualizarEstadoTarea } from "@/app/(dashboard)/tareas/actions";
import type { EstadoTarea } from "@/types";

/**
 * «Ya está» y «Empecé» sin abrir la tarea: hoy hay que entrar al detalle y usar
 * un desplegable para algo que se hace todos los días.
 *
 * Solo se renderiza sobre tareas propias y con permiso comprobado en el
 * servidor — la action revalida el rol y la responsabilidad, así que esto es
 * la capa de conveniencia, no la de seguridad.
 */
export function AccionesRapidas({
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

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
      <button
        type="button"
        disabled={pendiente}
        onClick={() => cambiar("Completada")}
        className="rounded-md bg-primary-500 px-3 py-1.5 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        Ya está
      </button>

      {estado === "Pendiente" && (
        <button
          type="button"
          disabled={pendiente}
          onClick={() => cambiar("En progreso")}
          className="rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Empecé
        </button>
      )}

      {error && (
        <p role="alert" className="text-sm text-error-600">
          {error}
        </p>
      )}
    </div>
  );
}
