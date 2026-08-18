"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/(dashboard)/horarios/actions";
import type { Rol, User } from "@/types";

export interface TurnoFormDefaultValues {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  grupo_nivel: string;
  capacidad: string;
  profesor_id: string;
}

const initialState: FormState = { error: null };

export function TurnoForm({
  action,
  profile,
  profesores,
  defaultValues,
  modo,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  profile: { id: string; rol: Rol };
  profesores: Pick<User, "id" | "nombre">[];
  defaultValues?: TurnoFormDefaultValues;
  modo: "crear" | "editar";
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="fecha" className="text-sm font-medium">
          Fecha
        </label>
        <input
          id="fecha"
          name="fecha"
          type="date"
          required
          defaultValue={defaultValues?.fecha}
          className="w-full rounded-md border border-border-strong px-3 py-2.5 text-sm"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1 space-y-1.5">
          <label htmlFor="hora_inicio" className="text-sm font-medium">
            Hora inicio
          </label>
          <input
            id="hora_inicio"
            name="hora_inicio"
            type="time"
            required
            defaultValue={defaultValues?.hora_inicio}
            className="w-full rounded-md border border-border-strong px-3 py-2.5 text-sm"
          />
        </div>
        <div className="flex-1 space-y-1.5">
          <label htmlFor="hora_fin" className="text-sm font-medium">
            Hora fin
          </label>
          <input
            id="hora_fin"
            name="hora_fin"
            type="time"
            required
            defaultValue={defaultValues?.hora_fin}
            className="w-full rounded-md border border-border-strong px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="grupo_nivel" className="text-sm font-medium">
          Grupo / nivel
        </label>
        <input
          id="grupo_nivel"
          name="grupo_nivel"
          type="text"
          required
          placeholder="Ej. Iniciación, Nivel 2"
          defaultValue={defaultValues?.grupo_nivel}
          className="w-full rounded-md border border-border-strong px-3 py-2.5 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="capacidad" className="text-sm font-medium">
          Capacidad
        </label>
        <input
          id="capacidad"
          name="capacidad"
          type="number"
          min={1}
          required
          defaultValue={defaultValues?.capacidad}
          className="w-full rounded-md border border-border-strong px-3 py-2.5 text-sm"
        />
      </div>

      {profile.rol === "Admin" ? (
        <div className="space-y-1.5">
          <label htmlFor="profesor_id" className="text-sm font-medium">
            Profesor
          </label>
          <select
            id="profesor_id"
            name="profesor_id"
            defaultValue={defaultValues?.profesor_id ?? ""}
            className="w-full rounded-md border border-border-strong px-3 py-2.5 text-sm"
          >
            <option value="">Sin asignar</option>
            {profesores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="text-sm text-text-subtle">
          Este turno queda asignado a vos como profesor.
        </p>
      )}

      {state.error && <p className="text-sm text-error-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-primary-500 py-2.5 text-sm font-medium text-on-primary disabled:opacity-50"
      >
        {pending ? "Guardando..." : modo === "crear" ? "Crear turno" : "Guardar cambios"}
      </button>
    </form>
  );
}
