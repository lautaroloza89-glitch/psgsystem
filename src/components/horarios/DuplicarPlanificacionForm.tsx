"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/(dashboard)/horarios/actions";
import type { TipoTurno } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { ChipOpcion } from "@/components/ui/ChipOpcion";

const INPUT_CLASS =
  "w-full rounded-md border border-border-strong px-3 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-focus-ring";

const TIPOS: TipoTurno[] = ["Patín", "Preparación física"];

const initialState: FormState = { error: null };

/**
 * Duplicar la planificación de una clase a otra fecha: el texto viene
 * precargado y se retoca antes de guardar.
 *
 * Es la tercera pantalla del módulo que se toca igual que las otras dos
 * (`PlanificarForm` y `TurnoForm`): mismo chip para el tipo, mismo textarea y
 * el mismo botón de 44px. Tenía el `select` nativo que el modelo `Pe` saca.
 */
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
  const [tipo, setTipo] = useState<TipoTurno>(
    TIPOS.includes(tipoInicial as TipoTurno) ? (tipoInicial as TipoTurno) : "Patín"
  );
  const [fecha, setFecha] = useState("");

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="tipo" value={tipo} />

      <div className="space-y-1.5">
        <label htmlFor="fecha" className="text-label font-medium">
          Nueva fecha
        </label>
        <input
          id="fecha"
          name="fecha"
          type="date"
          required
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className={INPUT_CLASS}
        />
        <p className="text-sm text-text-subtle">
          Se copia el texto y los profesores de la clase original.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="planificacion" className="text-label font-medium">
            La planificación
          </label>
          <div className="flex gap-2">
            {TIPOS.map((t) => (
              <ChipOpcion key={t} activo={tipo === t} onClick={() => setTipo(t)}>
                {t === "Preparación física" ? "Prep. física" : t}
              </ChipOpcion>
            ))}
          </div>
        </div>
        <textarea
          id="planificacion"
          name="planificacion"
          rows={8}
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
        disabled={pending || !fecha}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-500 py-3 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {pending && <Spinner />}
        {pending ? "Guardando..." : "Duplicar planificación"}
      </button>
    </form>
  );
}
