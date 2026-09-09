"use client";

import type { ReactNode } from "react";
import { useActionState, useState } from "react";
import { guardarObjetivoMes } from "@/app/(dashboard)/horarios/planificaciones-actions";
import type { FormState } from "@/app/(dashboard)/horarios/actions";
import { Spinner } from "@/components/ui/spinner";

const initialState: FormState = { error: null };

/**
 * A partir de acá el objetivo se muestra recortado con «Ver todo».
 *
 * Son unas cuatro líneas en un celular. Por debajo de eso, mostrarlo entero no
 * molesta y un control de más sería ruido; por encima, Luciana escribe
 * objetivos de párrafos enteros y el panel se comía la pantalla — había que
 * pasarlo scrolleando cada vez para llegar a las clases del mes, que es a lo
 * que se entra.
 */
const LARGO_PARA_RECORTAR = 180;

export function ObjetivoMesForm({
  grupoId,
  mes,
  objetivoInicial,
  puedeEditar,
  vista,
}: {
  grupoId: string;
  mes: string;
  objetivoInicial: string | null;
  puedeEditar: boolean;
  /** Markdown ya renderizado en el servidor (evita mandar react-markdown al cliente solo para esto). */
  vista: ReactNode;
}) {
  const [editando, setEditando] = useState(false);
  const [expandido, setExpandido] = useState(false);
  const accion = guardarObjetivoMes.bind(null, grupoId, mes);
  const [state, formAction, pending] = useActionState(accion, initialState);

  const recortable = (objetivoInicial?.length ?? 0) > LARGO_PARA_RECORTAR;
  const recortado = recortable && !expandido;

  const enlace =
    "text-sm font-medium text-primary-600 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded";

  if (!editando) {
    return (
      <div className="space-y-2">
        {/* Recortado y no colapsado del todo: las primeras líneas se leen sin
            tocar nada, que es lo que hace que el objetivo siga siendo el
            contexto de la pantalla, pero no empuja las clases fuera de vista.
            El degradado avisa que sigue, sin escribir «...». */}
        <div className={`relative ${recortado ? "max-h-24 overflow-hidden" : ""}`}>
          {vista}
          {recortado && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-surface to-transparent"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {recortable && (
            <button type="button" onClick={() => setExpandido(!expandido)} className={enlace}>
              {expandido ? "Ver menos" : "Ver todo"}
            </button>
          )}
          {puedeEditar && (
            <button type="button" onClick={() => setEditando(true)} className={enlace}>
              {objetivoInicial ? "Editar objetivo" : "Cargar objetivo"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        setEditando(false);
      }}
      className="space-y-2"
    >
      <textarea
        name="objetivo"
        rows={8}
        required
        defaultValue={objetivoInicial ?? ""}
        placeholder="Objetivo del mes (admite markdown)."
        className="w-full rounded-md border border-border-strong px-3 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-focus-ring"
      />
      {state.error && (
        <p role="alert" aria-live="assertive" className="text-sm text-error-600">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          {pending && <Spinner />}
          {pending ? "Guardando..." : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="rounded-md border border-border-strong px-4 py-2 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
