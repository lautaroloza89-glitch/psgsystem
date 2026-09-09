"use client";

import { useActionState, useEffect, useState } from "react";
import type { FormState } from "@/app/(dashboard)/alumnas/actions";
import { hoyArgentina } from "@/lib/utils/date";
import { Spinner } from "@/components/ui/spinner";

/**
 * Alta y edición de una alumna.
 *
 * Mismos campos y mismas validaciones que antes; cambia el orden. Arriba queda
 * **lo que hace falta para dar de alta a una alumna que llegó hoy**: nombre,
 * grupo y quién la trae con su teléfono — que era el dato más importante
 * después del nombre y estaba al final, abajo del scroll. El DNI y las dos
 * fechas se repliegan con sus valores por defecto a la vista: son campos que
 * casi siempre se dejan como vienen.
 *
 * El estado «Activa / Baja» salió de acá: es la acción que apaga la alerta de
 * inasistencia y decide hasta cuándo se cobra, así que vive en la ficha con
 * fecha y confirmación (`AccionesAlumna`).
 */

const CLASE_FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

const INPUT_CLASS = `w-full rounded-lg border border-border-strong px-3 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard focus:border-primary-500 ${CLASE_FOCO}`;

interface ContactoRow {
  key: string;
  id: string | null;
  nombre: string;
  telefono: string;
  relacion: string;
  esPagadorPrincipal: boolean;
}

function nuevaKey(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export interface AlumnaFormDefaultValues {
  apellido: string;
  nombre: string;
  dni: string | null;
  fecha_nacimiento: string | null;
  fecha_inscripcion: string;
  grupo_id: string;
  contactos: {
    id: string;
    nombre: string;
    telefono: string;
    relacion: string | null;
    es_pagador_principal: boolean;
  }[];
}

const initialState: FormState = { error: null };

function Campo({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function AlumnaForm({
  action,
  grupos,
  modo,
  defaultValues,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  grupos: { id: string; nombre: string }[];
  modo: "crear" | "editar";
  defaultValues?: AlumnaFormDefaultValues;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  const hoy = hoyArgentina();
  const [grupoId, setGrupoId] = useState(defaultValues?.grupo_id ?? "");
  const [dni, setDni] = useState(defaultValues?.dni ?? "");
  const [fechaNacimiento, setFechaNacimiento] = useState(defaultValues?.fecha_nacimiento ?? "");
  const [fechaInscripcion, setFechaInscripcion] = useState(
    defaultValues?.fecha_inscripcion ?? hoy
  );

  const [contactos, setContactos] = useState<ContactoRow[]>(
    () =>
      defaultValues?.contactos.map((c) => ({
        key: c.id,
        id: c.id,
        nombre: c.nombre,
        telefono: c.telefono,
        relacion: c.relacion ?? "",
        esPagadorPrincipal: c.es_pagador_principal,
      })) ??
      // En el alta arranca con una fila puesta: siempre hay alguien que la trae.
      [
        {
          key: nuevaKey(),
          id: null,
          nombre: "",
          telefono: "",
          relacion: "",
          esPagadorPrincipal: true,
        },
      ]
  );

  // Con un único contacto, queda marcado como pagador principal por default.
  useEffect(() => {
    if (contactos.length === 1 && !contactos[0].esPagadorPrincipal) {
      setContactos((prev) => prev.map((c) => ({ ...c, esPagadorPrincipal: true })));
    }
  }, [contactos]);

  function agregarContacto() {
    setContactos((prev) => [
      ...prev,
      {
        key: nuevaKey(),
        id: null,
        nombre: "",
        telefono: "",
        relacion: "",
        esPagadorPrincipal: false,
      },
    ]);
  }

  function actualizarContacto(
    key: string,
    campo: "nombre" | "telefono" | "relacion",
    valor: string
  ) {
    setContactos((prev) => prev.map((c) => (c.key === key ? { ...c, [campo]: valor } : c)));
  }

  const indicePagador = contactos.findIndex((c) => c.esPagadorPrincipal);
  const datosRepleglados =
    modo === "crear"
      ? `Inscripta hoy · ${dni ? `DNI ${dni}` : "DNI sin cargar"}`
      : `${dni ? `DNI ${dni}` : "Sin DNI"} · inscripta el ${fechaInscripcion || "—"}`;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="grupo_id" value={grupoId} />
      <input type="hidden" name="dni" value={dni} />
      <input type="hidden" name="fecha_nacimiento" value={fechaNacimiento} />
      <input type="hidden" name="fecha_inscripcion" value={fechaInscripcion} />
      <input type="hidden" name="pagador_principal_index" value={indicePagador} />

      <Campo id="apellido" label="Apellido">
        <input
          id="apellido"
          name="apellido"
          type="text"
          required
          defaultValue={defaultValues?.apellido ?? ""}
          className={INPUT_CLASS}
        />
      </Campo>

      <Campo id="nombre" label="Nombre">
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          defaultValue={defaultValues?.nombre ?? ""}
          className={INPUT_CLASS}
        />
      </Campo>

      <fieldset>
        <legend className="text-sm font-medium">Grupo</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {grupos.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={grupoId === g.id}
              onClick={() => setGrupoId(g.id)}
              className={`h-11 rounded-lg border px-4 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard ${CLASE_FOCO} ${
                grupoId === g.id
                  ? "border-primary-500 bg-primary-500 text-on-primary"
                  : "border-border bg-surface text-text-subtle hover:border-border-strong hover:text-text"
              }`}
            >
              {g.nombre}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <legend className="text-sm font-medium">Quién la trae</legend>
          <button
            type="button"
            onClick={agregarContacto}
            className={`rounded text-sm font-medium text-primary-600 hover:text-primary-700 ${CLASE_FOCO}`}
          >
            + Otro contacto
          </button>
        </div>

        {contactos.map((c, i) => (
          <div key={c.key} className="space-y-2 rounded-xl border border-border bg-surface p-3">
            <input type="hidden" name="contacto_id" value={c.id ?? ""} />

            <input
              type="text"
              name="contacto_nombre"
              value={c.nombre}
              onChange={(e) => actualizarContacto(c.key, "nombre", e.target.value)}
              placeholder="Nombre y apellido"
              aria-label={`Nombre del contacto ${i + 1}`}
              className={INPUT_CLASS}
            />

            <div className="flex gap-2">
              <input
                type="text"
                name="contacto_relacion"
                value={c.relacion}
                onChange={(e) => actualizarContacto(c.key, "relacion", e.target.value)}
                placeholder="Madre, padre…"
                aria-label={`Relación del contacto ${i + 1}`}
                className={INPUT_CLASS}
              />
              <input
                type="tel"
                name="contacto_telefono"
                value={c.telefono}
                onChange={(e) => actualizarContacto(c.key, "telefono", e.target.value)}
                placeholder="Teléfono"
                aria-label={`Teléfono del contacto ${i + 1}`}
                className={INPUT_CLASS}
              />
            </div>

            {contactos.length === 1 ? (
              // El primer contacto ya era el pagador en el código, pero se
              // decía con una casilla tildada sola. Dicho con palabras.
              <p className="text-sm text-text-subtle">
                Es la que paga la cuota. Si agregás otro contacto, podés cambiarlo.
              </p>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="pagador_visual"
                    checked={c.esPagadorPrincipal}
                    onChange={() =>
                      setContactos((prev) =>
                        prev.map((otro) => ({
                          ...otro,
                          esPagadorPrincipal: otro.key === c.key,
                        }))
                      )
                    }
                    className="h-4 w-4 accent-primary-500"
                  />
                  Paga la cuota
                </label>
                <button
                  type="button"
                  onClick={() => setContactos((prev) => prev.filter((o) => o.key !== c.key))}
                  className={`rounded px-2 py-1 text-sm font-medium text-text-subtle hover:text-error-600 ${CLASE_FOCO}`}
                >
                  Quitar
                </button>
              </div>
            )}
          </div>
        ))}
      </fieldset>

      {/* DNI y fechas: replegados, con sus valores a la vista. */}
      <details className="overflow-hidden rounded-xl border border-border bg-surface">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted">
          <span>
            <span className="block font-medium">DNI, fecha de nacimiento e inscripción</span>
            <span className="block text-text-subtle">{datosRepleglados}</span>
          </span>
          <span className="shrink-0 font-medium text-primary-600">Editar</span>
        </summary>

        <div className="space-y-3 border-t border-border p-4">
          <Campo id="dni-campo" label="DNI (opcional)">
            <input
              id="dni-campo"
              type="text"
              inputMode="numeric"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              className={INPUT_CLASS}
            />
          </Campo>

          <Campo id="nacimiento-campo" label="Fecha de nacimiento (opcional)">
            <input
              id="nacimiento-campo"
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              className={INPUT_CLASS}
            />
          </Campo>

          <Campo id="inscripcion-campo" label="Fecha de inscripción">
            <input
              id="inscripcion-campo"
              type="date"
              value={fechaInscripcion}
              onChange={(e) => setFechaInscripcion(e.target.value)}
              className={INPUT_CLASS}
            />
          </Campo>
        </div>
      </details>

      {state.error && (
        <p role="alert" aria-live="assertive" className="text-sm text-error-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`flex w-full items-center justify-center gap-2 rounded-md bg-primary-500 py-2.5 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 ${CLASE_FOCO}`}
      >
        {pending && <Spinner />}
        {pending
          ? "Guardando..."
          : modo === "crear"
            ? "Crear alumna"
            : "Guardar cambios"}
      </button>
    </form>
  );
}
