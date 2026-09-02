"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import type { FormState } from "@/app/(dashboard)/alumnas/actions";
import type { EstadoAlumna } from "@/types";
import { Spinner } from "@/components/ui/spinner";

const INPUT_CLASS =
  "w-full rounded-md border border-border-strong px-3 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-focus-ring";

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
  fecha_inscripcion: string;
  grupo_id: string;
  estado: EstadoAlumna;
  contactos: {
    id: string;
    nombre: string;
    telefono: string;
    relacion: string | null;
    es_pagador_principal: boolean;
  }[];
}

const initialState: FormState = { error: null };

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
  const [contactos, setContactos] = useState<ContactoRow[]>(
    () =>
      defaultValues?.contactos.map((c) => ({
        key: c.id,
        id: c.id,
        nombre: c.nombre,
        telefono: c.telefono,
        relacion: c.relacion ?? "",
        esPagadorPrincipal: c.es_pagador_principal,
      })) ?? []
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
      { key: nuevaKey(), id: null, nombre: "", telefono: "", relacion: "", esPagadorPrincipal: false },
    ]);
  }

  function quitarContacto(key: string) {
    setContactos((prev) => prev.filter((c) => c.key !== key));
  }

  function actualizarContacto(key: string, campo: "nombre" | "telefono" | "relacion", valor: string) {
    setContactos((prev) => prev.map((c) => (c.key === key ? { ...c, [campo]: valor } : c)));
  }

  function marcarPagador(key: string) {
    setContactos((prev) => prev.map((c) => ({ ...c, esPagadorPrincipal: c.key === key })));
  }

  const pagadorIndex = contactos.findIndex((c) => c.esPagadorPrincipal);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="apellido" className="text-label font-medium">
            Apellido
          </label>
          <input
            id="apellido"
            name="apellido"
            type="text"
            required
            defaultValue={defaultValues?.apellido}
            className={INPUT_CLASS}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="nombre" className="text-label font-medium">
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            defaultValue={defaultValues?.nombre}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="dni" className="text-label font-medium">
            DNI <span className="font-normal text-text-subtle">(opcional)</span>
          </label>
          <input
            id="dni"
            name="dni"
            type="text"
            inputMode="numeric"
            defaultValue={defaultValues?.dni ?? ""}
            className={INPUT_CLASS}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="fecha_inscripcion" className="text-label font-medium">
            Fecha de inscripción
          </label>
          <input
            id="fecha_inscripcion"
            name="fecha_inscripcion"
            type="date"
            required
            defaultValue={defaultValues?.fecha_inscripcion ?? new Date().toISOString().slice(0, 10)}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="grupo_id" className="text-label font-medium">
            Grupo
          </label>
          <select
            id="grupo_id"
            name="grupo_id"
            required
            defaultValue={defaultValues?.grupo_id ?? ""}
            className={INPUT_CLASS}
          >
            <option value="" disabled>
              Elegí un grupo
            </option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
            ))}
          </select>
        </div>

        {modo === "editar" && (
          <div className="space-y-1.5">
            <label htmlFor="estado" className="text-label font-medium">
              Estado
            </label>
            <select
              id="estado"
              name="estado"
              defaultValue={defaultValues?.estado ?? "activa"}
              className={INPUT_CLASS}
            >
              <option value="activa">Activa</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-label font-medium">Contactos</span>
          <button
            type="button"
            onClick={agregarContacto}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            + Agregar contacto
          </button>
        </div>

        {contactos.length === 0 && (
          <p className="text-sm text-text-subtle">Todavía no agregaste ningún contacto.</p>
        )}

        <input type="hidden" name="pagador_principal_index" value={pagadorIndex} />

        {contactos.map((contacto, i) => (
          <div
            key={contacto.key}
            className="space-y-3 rounded-lg border border-border p-4"
          >
            <input type="hidden" name="contacto_id" value={contacto.id ?? ""} />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor={`contacto_nombre_${i}`} className="text-sm font-medium">
                  Nombre
                </label>
                <input
                  id={`contacto_nombre_${i}`}
                  name="contacto_nombre"
                  type="text"
                  value={contacto.nombre}
                  onChange={(e) => actualizarContacto(contacto.key, "nombre", e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor={`contacto_telefono_${i}`} className="text-sm font-medium">
                  Teléfono
                </label>
                <input
                  id={`contacto_telefono_${i}`}
                  name="contacto_telefono"
                  type="text"
                  value={contacto.telefono}
                  onChange={(e) => actualizarContacto(contacto.key, "telefono", e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor={`contacto_relacion_${i}`} className="text-sm font-medium">
                  Relación <span className="font-normal text-text-subtle">(opcional)</span>
                </label>
                <input
                  id={`contacto_relacion_${i}`}
                  name="contacto_relacion"
                  type="text"
                  placeholder="Madre, padre, tía…"
                  value={contacto.relacion}
                  onChange={(e) => actualizarContacto(contacto.key, "relacion", e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="flex items-end gap-2 pb-2.5">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={contacto.esPagadorPrincipal}
                    onChange={() => marcarPagador(contacto.key)}
                    className="h-4 w-4 rounded border-border-strong text-primary-500 focus:ring-focus-ring"
                  />
                  Pagador principal
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={() => quitarContacto(contacto.key)}
              className="text-sm font-medium text-error-600 hover:text-error-700"
            >
              Quitar contacto
            </button>
          </div>
        ))}
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
        {pending ? "Guardando..." : modo === "crear" ? "Crear alumna" : "Guardar cambios"}
      </button>
    </form>
  );
}
