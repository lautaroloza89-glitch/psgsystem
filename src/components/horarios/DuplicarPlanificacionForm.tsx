"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/(dashboard)/horarios/actions";
import { Spinner } from "@/components/ui/spinner";

const INPUT_CLASS =
  "w-full rounded-md border border-border-strong px-3 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-focus-ring";

const initialState: FormState = { error: null };

export function DuplicarPlanificacionForm({
  action,
  tipoInicial,
  planificacionInicial,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  tipoInicial: string;
  planificacionInicial: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="fecha" className="text-label font-medium">
          Nueva fecha
        </label>
        <input id="fecha" name="fecha" type="date" required className={INPUT_CLASS} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="tipo" className="text-label font-medium">
          Tipo de clase
        </label>
        <select id="tipo" name="tipo" defaultValue={tipoInicial} className={INPUT_CLASS}>
          <option value="Patín">Patín</option>
          <option value="Preparación física">Preparación física</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="planificacion" className="text-label font-medium">
          Planificación
        </label>
        <textarea
          id="planificacion"
          name="planificacion"
          rows={10}
          required
          defaultValue={planificacionInicial}
          className={INPUT_CLASS}
        />
      </div>

      {state.error && (
        <p role="alert" aria-live="assertive" className="text-sm text-error-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-500 py-2.5 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {pending && <Spinner />}
        {pending ? "Guardando..." : "Duplicar planificación"}
      </button>
    </form>
  );
}
