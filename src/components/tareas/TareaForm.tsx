"use client";

import { useActionState } from "react";
import type { User } from "@/types";
import type { FormState } from "@/app/(dashboard)/tareas/actions";
import { AsignadosChecklist } from "./AsignadosChecklist";
import { Spinner } from "@/components/ui/spinner";

const INPUT_CLASS =
  "w-full rounded-md border border-border-strong px-3 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-focus-ring";

export interface TareaFormDefaultValues {
  titulo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  asignadosIds: string[];
}

const initialState: FormState = { error: null };

export function TareaForm({
  action,
  usuarios,
  defaultValues,
  modo,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  usuarios: Pick<User, "id" | "nombre" | "rol">[];
  defaultValues?: TareaFormDefaultValues;
  modo: "crear" | "editar";
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="titulo" className="text-label font-medium">
          Título
        </label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          required
          defaultValue={defaultValues?.titulo}
          className={INPUT_CLASS}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="descripcion" className="text-label font-medium">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          defaultValue={defaultValues?.descripcion}
          className={INPUT_CLASS}
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1 space-y-1.5">
          <label htmlFor="fecha_inicio" className="text-label font-medium">
            Fecha de inicio
          </label>
          <input
            id="fecha_inicio"
            name="fecha_inicio"
            type="date"
            defaultValue={defaultValues?.fecha_inicio}
            className={INPUT_CLASS}
          />
        </div>
        <div className="flex-1 space-y-1.5">
          <label htmlFor="fecha_vencimiento" className="text-label font-medium">
            Fecha de vencimiento
          </label>
          <input
            id="fecha_vencimiento"
            name="fecha_vencimiento"
            type="date"
            defaultValue={defaultValues?.fecha_vencimiento}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <fieldset className="space-y-1.5">
        <legend className="text-label font-medium">Responsables</legend>
        <AsignadosChecklist usuarios={usuarios} seleccionados={defaultValues?.asignadosIds} />
      </fieldset>

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
        {pending
          ? "Guardando..."
          : modo === "crear"
            ? "Crear tarea"
            : "Guardar cambios"}
      </button>
    </form>
  );
}
