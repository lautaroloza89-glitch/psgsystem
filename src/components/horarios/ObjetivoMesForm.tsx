"use client";

import type { ReactNode } from "react";
import { useActionState, useState } from "react";
import { guardarObjetivoMes } from "@/app/(dashboard)/horarios/planificaciones-actions";
import type { FormState } from "@/app/(dashboard)/horarios/actions";
import { Spinner } from "@/components/ui/spinner";

const initialState: FormState = { error: null };

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
  const accion = guardarObjetivoMes.bind(null, grupoId, mes);
  const [state, formAction, pending] = useActionState(accion, initialState);

  if (!editando) {
    return (
      <div className="space-y-2">
        {vista}
        {puedeEditar && (
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {objetivoInicial ? "Editar objetivo" : "Cargar objetivo"}
          </button>
        )}
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
        rows={4}
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
