"use client";

import { useActionState } from "react";
import type { User } from "@/types";
import type { FormState } from "@/app/(dashboard)/tareas/actions";
import { AsignadosChecklist } from "./AsignadosChecklist";

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
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-1">
        <label htmlFor="titulo" className="text-sm font-medium">
          Título
        </label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          required
          defaultValue={defaultValues?.titulo}
          className="w-full rounded border border-black/20 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="descripcion" className="text-sm font-medium">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          defaultValue={defaultValues?.descripcion}
          className="w-full rounded border border-black/20 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1 space-y-1">
          <label htmlFor="fecha_inicio" className="text-sm font-medium">
            Fecha de inicio
          </label>
          <input
            id="fecha_inicio"
            name="fecha_inicio"
            type="date"
            defaultValue={defaultValues?.fecha_inicio}
            className="w-full rounded border border-black/20 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label htmlFor="fecha_vencimiento" className="text-sm font-medium">
            Fecha de vencimiento
          </label>
          <input
            id="fecha_vencimiento"
            name="fecha_vencimiento"
            type="date"
            defaultValue={defaultValues?.fecha_vencimiento}
            className="w-full rounded border border-black/20 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-sm font-medium">Responsables</span>
        <AsignadosChecklist usuarios={usuarios} seleccionados={defaultValues?.asignadosIds} />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-black py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending
          ? "Guardando..."
          : modo === "crear"
            ? "Crear tarea"
            : "Guardar cambios"}
      </button>
    </form>
  );
}
