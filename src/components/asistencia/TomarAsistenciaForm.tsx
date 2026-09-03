"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/(dashboard)/asistencia/actions";
import { Spinner } from "@/components/ui/spinner";

const initialState: FormState = { error: null };

export interface AlumnaAsistencia {
  id: string;
  apellido: string;
  nombre: string;
}

export function TomarAsistenciaForm({
  action,
  alumnas,
  presentesIniciales,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  alumnas: AlumnaAsistencia[];
  /**
   * Ids de las alumnas con `presente = true` guardado. Vacío en una fecha que
   * todavía no se cargó: el formulario arranca sin nadie tildado y la
   * Secretaria marca solo a las que están.
   */
  presentesIniciales: string[];
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [presentes, setPresentes] = useState<Set<string>>(new Set(presentesIniciales));

  function alternar(alumnaId: string, marcada: boolean) {
    setPresentes((previo) => {
      const siguiente = new Set(previo);
      if (marcada) siguiente.add(alumnaId);
      else siguiente.delete(alumnaId);
      return siguiente;
    });
  }

  const ausentes = alumnas.length - presentes.size;

  return (
    <form action={formAction} className="space-y-5">
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
        {alumnas.map((alumna) => (
          <li key={alumna.id}>
            <label className="flex min-h-14 cursor-pointer items-center gap-3 px-4 py-3 transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted has-[:focus-visible]:bg-surface-muted">
              <input
                type="checkbox"
                name="presente"
                value={alumna.id}
                checked={presentes.has(alumna.id)}
                onChange={(e) => alternar(alumna.id, e.target.checked)}
                className="h-5 w-5 shrink-0 accent-primary-500"
              />
              <span className="text-sm font-medium">
                {alumna.apellido}, {alumna.nombre}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <p aria-live="polite" className="text-sm text-text-subtle">
        {presentes.size} {presentes.size === 1 ? "presente" : "presentes"} · {ausentes}{" "}
        {ausentes === 1 ? "ausente" : "ausentes"}
      </p>

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
        {pending ? "Guardando..." : "Guardar asistencia"}
      </button>
    </form>
  );
}
