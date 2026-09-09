"use client";

import { useActionState, useState } from "react";
import type { User } from "@/types";
import type { FormState } from "@/app/(dashboard)/tareas/actions";
import { ChipsResponsables } from "@/components/tareas/ChipsResponsables";
import { Spinner } from "@/components/ui/spinner";
import { lunesDeLaSemana, sumarDias } from "@/lib/utils/date";

const INPUT_CLASS =
  "w-full rounded-md border border-border-strong px-3 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-focus-ring";

const CHIP_CLASS =
  "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

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
  /** `hoyArgentina()` calculado en el servidor: el cliente no calcula fechas. */
  hoy,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  usuarios: Pick<User, "id" | "nombre" | "rol" | "cargo">[];
  defaultValues?: TareaFormDefaultValues;
  modo: "crear" | "editar";
  hoy: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [vence, setVence] = useState(defaultValues?.fecha_vencimiento ?? "");
  const [otraFecha, setOtraFecha] = useState(false);
  // La fecha de inicio casi nunca se usa: se repliega salvo que ya tenga valor.
  const [conInicio, setConInicio] = useState(!!defaultValues?.fecha_inicio);

  // «Esta semana» es el domingo de la semana en curso, misma convención
  // lunes-domingo que usa la alerta de inasistencias.
  const domingo = sumarDias(lunesDeLaSemana(hoy), 6);
  const manana = sumarDias(hoy, 1);

  const atajos = [
    { label: "Hoy", valor: hoy },
    { label: "Mañana", valor: manana },
    // Si el domingo ya es hoy o mañana, el atajo no agrega nada.
    ...(domingo > manana ? [{ label: "Esta semana", valor: domingo }] : []),
  ];

  const usaAtajo = atajos.some((a) => a.valor === vence);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-1.5">
        <label htmlFor="titulo" className="text-label font-medium">
          Qué se debe hacer
        </label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          required
          autoComplete="off"
          placeholder="Comprar cintas para Iniciación"
          defaultValue={defaultValues?.titulo}
          className={INPUT_CLASS}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-label font-medium">Encargados de realizar la tarea</legend>
        <ChipsResponsables usuarios={usuarios} seleccionados={defaultValues?.asignadosIds} />
        <p className="text-sm text-text-subtle">
          Solo el personal del club. Las patinadoras no reciben tareas.
        </p>
      </fieldset>

      {/* Las dos fechas, juntas y con nombres que las distinguen.
          «Para cuándo» arriba y «Fecha de inicio» abajo del Detalle se leían
          como dos maneras de cargar lo mismo: son columnas distintas
          (`fecha_vencimiento` y `fecha_inicio`) y ahora lo dicen. */}
      <fieldset className="space-y-2">
        <legend className="text-label font-medium">Fecha límite</legend>
        <p className="text-sm text-text-subtle">Hasta cuándo hay tiempo de hacerla.</p>
        <div className="flex flex-wrap gap-2">
          {atajos.map((atajo) => {
            const activo = vence === atajo.valor;
            return (
              <button
                key={atajo.label}
                type="button"
                aria-pressed={activo}
                onClick={() => {
                  setVence(atajo.valor);
                  setOtraFecha(false);
                }}
                className={`${CHIP_CLASS} ${
                  activo
                    ? "border-primary-500 bg-primary-500 text-on-primary"
                    : "border-border-strong hover:bg-surface-muted"
                }`}
              >
                {atajo.label}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={otraFecha || (!!vence && !usaAtajo)}
            onClick={() => setOtraFecha(true)}
            className={`${CHIP_CLASS} ${
              otraFecha || (!!vence && !usaAtajo)
                ? "border-primary-500 bg-primary-500 text-on-primary"
                : "border-border-strong hover:bg-surface-muted"
            }`}
          >
            Otra fecha
          </button>
        </div>

        {(otraFecha || (!!vence && !usaAtajo)) && (
          <input
            aria-label="Fecha límite"
            type="date"
            value={vence}
            onChange={(e) => setVence(e.target.value)}
            className={INPUT_CLASS}
          />
        )}

        {/* El valor viaja siempre por acá, elija atajo o calendario: la
            validación del servidor no cambia. */}
        <input type="hidden" name="fecha_vencimiento" value={vence} />
      </fieldset>

      {/* Va pegada a la fecha límite, no al final del formulario: son las dos
          fechas de la tarea y separarlas era lo que las hacía parecer la
          misma. Casi nunca se usa, así que sigue replegada. */}
      <div className="space-y-1.5">
        {conInicio ? (
          <>
            <label htmlFor="fecha_inicio" className="text-label font-medium">
              Cuándo se empieza{" "}
              <span className="font-normal text-text-subtle">· opcional</span>
            </label>
            <input
              id="fecha_inicio"
              name="fecha_inicio"
              type="date"
              defaultValue={defaultValues?.fecha_inicio}
              className={INPUT_CLASS}
            />
            <p className="text-sm text-text-subtle">
              Solo si la tarea no arranca hoy. No es la fecha límite.
            </p>
          </>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <span className="text-label font-medium">
              Cuándo se empieza{" "}
              <span className="font-normal text-text-subtle">· opcional</span>
            </span>
            <button
              type="button"
              onClick={() => setConInicio(true)}
              className="rounded px-1 text-sm font-medium text-primary-600 transition-colors duration-[var(--duration-fast)] ease-standard hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Agregar
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="descripcion" className="text-label font-medium">
          Detalle <span className="font-normal text-text-subtle">· opcional</span>
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          autoComplete="off"
          placeholder="Marca, cantidad, dónde comprarlas…"
          defaultValue={defaultValues?.descripcion}
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
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-500 py-3 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {pending && <Spinner />}
        {pending ? "Guardando..." : modo === "crear" ? "Crear tarea" : "Guardar cambios"}
      </button>
    </form>
  );
}
