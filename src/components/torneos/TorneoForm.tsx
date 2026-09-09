"use client";

import { useState } from "react";
import { useActionState } from "react";
import type { FormState } from "@/app/(dashboard)/torneos/actions";
import type { TipoTorneo } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { ChipOpcion } from "@/components/ui/ChipOpcion";
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

/**
 * Mismos seis campos y las mismas validaciones. Lo que cambia es que dos cosas
 * que el formulario ya hacía por dentro ahora se ven:
 *
 * - El tipo era un `select` de tres opciones que abría la rueda de iOS; ahora
 *   son tres chips.
 * - La fecha de fin ya se autocompletaba con la de inicio, porque el caso
 *   normal es un solo día, pero eso no se notaba: había dos campos de fecha
 *   idénticos y había que cargar la misma dos veces. «Un día / Varios días»
 *   lo dice, y con «Un día» el segundo campo directamente no está.
 * - «En el club» era una aclaración entre paréntesis en el placeholder; ahora
 *   es un chip que llena el campo.
 */
export function TorneoForm({
  action,
  defaultValues,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: TorneoFormDefaultValues;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [tipo, setTipo] = useState<TipoTorneo>(defaultValues?.tipo ?? "torneo");
  const [fechaInicio, setFechaInicio] = useState(defaultValues?.fecha_inicio ?? "");
  const [fechaFin, setFechaFin] = useState(defaultValues?.fecha_fin ?? "");
  const [lugar, setLugar] = useState(defaultValues?.lugar ?? "");
  const [variosDias, setVariosDias] = useState(
    !!defaultValues && defaultValues.fecha_inicio !== defaultValues.fecha_fin
  );

  function handleFechaInicioChange(valor: string) {
    setFechaInicio(valor);
    // Con «Un día» las dos fechas son la misma y el usuario nunca ve la de
    // fin: el formulario la mantiene al día sin que tenga que cargarla.
    if (!variosDias) setFechaFin(valor);
  }

  function cambiarDuracion(varios: boolean) {
    setVariosDias(varios);
    if (!varios) setFechaFin(fechaInicio);
  }

  const rangoInvalido = variosDias && !!fechaInicio && !!fechaFin && fechaFin < fechaInicio;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="fecha_fin" value={variosDias ? fechaFin : fechaInicio} />

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

      <fieldset className="space-y-2">
        <legend className="text-label font-medium">Tipo</legend>
        <div className="flex flex-wrap gap-2">
          {TIPOS.map((t) => (
            <ChipOpcion key={t} activo={tipo === t} onClick={() => setTipo(t)}>
              {LABEL_TIPO_TORNEO[t]}
            </ChipOpcion>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <legend className="text-label font-medium">Cuándo</legend>
          <div className="flex gap-2">
            <ChipOpcion activo={!variosDias} onClick={() => cambiarDuracion(false)}>
              Un día
            </ChipOpcion>
            <ChipOpcion activo={variosDias} onClick={() => cambiarDuracion(true)}>
              Varios días
            </ChipOpcion>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="fecha_inicio" className="sr-only">
            {variosDias ? "Fecha de inicio" : "Fecha"}
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

        {variosDias && (
          <div className="space-y-1.5">
            <label htmlFor="fecha_fin_visible" className="text-label font-medium">
              Hasta
            </label>
            <input
              id="fecha_fin_visible"
              type="date"
              required
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        )}

        {rangoInvalido && (
          <p className="text-sm text-error-600">
            La fecha de fin no puede ser anterior a la de inicio.
          </p>
        )}
      </fieldset>

      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="lugar" className="text-label font-medium">
            Lugar
          </label>
          <ChipOpcion activo={lugar === ""} onClick={() => setLugar("")}>
            En el club
          </ChipOpcion>
        </div>
        <input
          id="lugar"
          name="lugar"
          type="text"
          value={lugar}
          onChange={(e) => setLugar(e.target.value)}
          placeholder="San Juan, Río Segundo - Córdoba…"
          className={INPUT_CLASS}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="notas" className="text-label font-medium">
          Notas
        </label>
        <textarea
          id="notas"
          name="notas"
          rows={4}
          defaultValue={defaultValues?.notas ?? ""}
          placeholder="Horarios, categorías, qué llevar… opcional."
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
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-500 py-3 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {pending && <Spinner />}
        {pending ? "Guardando..." : "Guardar torneo"}
      </button>
    </form>
  );
}
