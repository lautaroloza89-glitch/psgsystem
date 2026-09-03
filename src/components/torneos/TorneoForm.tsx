"use client";

import { useState } from "react";
import { useActionState } from "react";
import type { FormState } from "@/app/(dashboard)/torneos/actions";
import type { TipoTorneo } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { LABEL_TIPO_TORNEO } from "@/lib/torneos/tipo";

const INPUT_CLASS =
  "w-full rounded-md border border-border-strong px-3 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-focus-ring";

const TIPOS: TipoTorneo[] = ["torneo", "exhibicion", "evento"];

export interface TorneoFormDefaultValues {
  nombre: string;
  tipo: TipoTorneo;
  lugar: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  notas: string | null;
}

const initialState: FormState = { error: null };

export function TorneoForm({
  action,
  defaultValues,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: TorneoFormDefaultValues;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [fechaInicio, setFechaInicio] = useState(defaultValues?.fecha_inicio ?? "");
  const [fechaFin, setFechaFin] = useState(defaultValues?.fecha_fin ?? "");
  const [fechaFinTocada, setFechaFinTocada] = useState(!!defaultValues);

  function handleFechaInicioChange(valor: string) {
    setFechaInicio(valor);
    // El caso más común es de un solo día: autocompletar fecha_fin evita
    // cargar la misma fecha dos veces. Solo mientras el usuario no la tocó
    // a mano (para no pisarle una fecha de fin ya elegida).
    if (!fechaFinTocada) {
      setFechaFin(valor);
    }
  }

  const rangoInvalido = !!fechaInicio && !!fechaFin && fechaFin < fechaInicio;

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="nombre" className="text-label font-medium">
          Nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          defaultValue={defaultValues?.nombre ?? ""}
          placeholder="Torneo Absoluto, Copa González Molina..."
          className={INPUT_CLASS}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="tipo" className="text-label font-medium">
          Tipo
        </label>
        <select
          id="tipo"
          name="tipo"
          defaultValue={defaultValues?.tipo ?? "torneo"}
          className={INPUT_CLASS}
        >
          {TIPOS.map((tipo) => (
            <option key={tipo} value={tipo}>
              {LABEL_TIPO_TORNEO[tipo]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="lugar" className="text-label font-medium">
          Lugar
        </label>
        <input
          id="lugar"
          name="lugar"
          type="text"
          defaultValue={defaultValues?.lugar ?? ""}
          placeholder="San Juan, Río Segundo - Córdoba... (vacío si es en el club)"
          className={INPUT_CLASS}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="fecha_inicio" className="text-label font-medium">
            Fecha de inicio
          </label>
          <input
            id="fecha_inicio"
            name="fecha_inicio"
            type="date"
            required
            value={fechaInicio}
            onChange={(e) => handleFechaInicioChange(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="fecha_fin" className="text-label font-medium">
            Fecha de fin
          </label>
          <input
            id="fecha_fin"
            name="fecha_fin"
            type="date"
            required
            value={fechaFin}
            onChange={(e) => {
              setFechaFinTocada(true);
              setFechaFin(e.target.value);
            }}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      {rangoInvalido && (
        <p className="text-sm text-error-600">La fecha de fin no puede ser anterior a la de inicio.</p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="notas" className="text-label font-medium">
          Notas
        </label>
        <textarea
          id="notas"
          name="notas"
          rows={4}
          defaultValue={defaultValues?.notas ?? ""}
          placeholder="Opcional"
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
        disabled={pending || rangoInvalido}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-500 py-2.5 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {pending && <Spinner />}
        {pending ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}
