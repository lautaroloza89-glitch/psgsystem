"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/(dashboard)/asistencia/actions";
import { Spinner } from "@/components/ui/spinner";

const initialState: FormState = { error: null };

export type Marca = "vino" | "falto";

export interface AlumnaAsistencia {
  id: string;
  apellido: string;
  nombre: string;
  /**
   * Semanas seguidas sin venir, si ya son suficientes para avisar. La alerta
   * aparece acá, en la fila, que es donde sirve: quien está tomando asistencia
   * puede preguntar por ella en el momento.
   */
  semanasSinVenir: number | null;
}

const CLASE_FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

function BotonMarca({
  etiqueta,
  activo,
  tono,
  onClick,
}: {
  etiqueta: string;
  activo: boolean;
  tono: "vino" | "falto";
  onClick: () => void;
}) {
  const activoClase =
    tono === "vino"
      ? "border-success-500 bg-success-500 text-white"
      : "border-error-500 bg-error-500 text-white";

  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      // 44px de alto: el objetivo de toque tiene que servir con guantes y a
      // media luz, no como la casilla de 20px que había antes.
      className={`h-11 w-[72px] shrink-0 rounded-lg border text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard ${CLASE_FOCO} ${
        activo
          ? activoClase
          : "border-border bg-surface text-text-subtle hover:border-border-strong hover:text-text"
      }`}
    >
      {etiqueta}
    </button>
  );
}

/**
 * Tomar asistencia con «Vino / Faltó» explícito.
 *
 * El cambio de fondo respecto de F2 MOD 4: **sin marcar ya no es ausente**.
 * Antes, guardar escribía una fila por cada alumna activa del grupo, así que
 * la que te olvidabas de tocar quedaba ausente y esa ausencia le contaba para
 * la alerta de 3 semanas. Ahora se guarda solo lo marcado, el pie avisa
 * cuántas quedan sin tocar antes de guardar, y la fecha queda en estado
 * Parcial hasta completarla.
 */
export function TomarAsistenciaForm({
  action,
  alumnas,
  marcasIniciales,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  alumnas: AlumnaAsistencia[];
  /** Lo ya guardado para esa fecha. Vacío en una fecha que todavía no se cargó. */
  marcasIniciales: Record<string, Marca>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [marcas, setMarcas] = useState<Record<string, Marca>>(marcasIniciales);

  function marcar(alumnaId: string, marca: Marca) {
    setMarcas((previo) => {
      const siguiente = { ...previo };
      // Volver a tocar el botón ya activo desmarca: es la forma de corregir
      // sin dejar una marca que nadie quiso poner.
      if (siguiente[alumnaId] === marca) delete siguiente[alumnaId];
      else siguiente[alumnaId] = marca;
      return siguiente;
    });
  }

  function todasPresentes() {
    setMarcas(Object.fromEntries(alumnas.map((a) => [a.id, "vino" as Marca])));
  }

  const vinieron = alumnas.filter((a) => marcas[a.id] === "vino").length;
  const faltaron = alumnas.filter((a) => marcas[a.id] === "falto").length;
  const sinMarcar = alumnas.length - vinieron - faltaron;

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={todasPresentes}
          className={`flex-1 rounded-lg border border-border bg-surface py-2.5 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:border-border-strong ${CLASE_FOCO}`}
        >
          Todas presentes
        </button>
        <button
          type="button"
          onClick={() => setMarcas({})}
          className={`rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-subtle transition-colors duration-[var(--duration-fast)] ease-standard hover:border-border-strong hover:text-text ${CLASE_FOCO}`}
        >
          Limpiar
        </button>
      </div>

      <ul className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
        {alumnas.map((alumna) => {
          const marca = marcas[alumna.id];
          return (
            <li key={alumna.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug">
                  {alumna.apellido}, {alumna.nombre}
                </p>
                {alumna.semanasSinVenir !== null && (
                  <p className="mt-0.5 text-sm text-warning-700">
                    Lleva {alumna.semanasSinVenir}{" "}
                    {alumna.semanasSinVenir === 1 ? "semana" : "semanas"} sin venir
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <BotonMarca
                  etiqueta="Vino"
                  tono="vino"
                  activo={marca === "vino"}
                  onClick={() => marcar(alumna.id, "vino")}
                />
                <BotonMarca
                  etiqueta="Faltó"
                  tono="falto"
                  activo={marca === "falto"}
                  onClick={() => marcar(alumna.id, "falto")}
                />
              </div>

              {marca && <input type="hidden" name={marca === "vino" ? "vino" : "falto"} value={alumna.id} />}
            </li>
          );
        })}
      </ul>

      {state.error && (
        <p role="alert" aria-live="assertive" className="text-sm text-error-600">
          {state.error}
        </p>
      )}

      {/* El conteo y el botón dejan de estar al fondo de trece filas: se pegan
          arriba de la barra de pestañas y acompañan el scroll. */}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] -mx-4 border-t border-border bg-surface px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] sm:-mx-8 sm:px-8">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <p aria-live="polite" className="min-w-0 flex-1 text-sm">
            <span className="block font-medium tabular-nums">
              {vinieron} {vinieron === 1 ? "vino" : "vinieron"} · {faltaron}{" "}
              {faltaron === 1 ? "faltó" : "faltaron"}
            </span>
            <span
              className={`block ${sinMarcar > 0 ? "font-medium text-warning-700" : "text-text-subtle"}`}
            >
              {sinMarcar > 0
                ? `Faltan ${sinMarcar} sin marcar`
                : "Están todas marcadas"}
            </span>
          </p>

          <button
            type="submit"
            disabled={pending}
            className={`flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary-500 px-6 py-2.5 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 ${CLASE_FOCO}`}
          >
            {pending && <Spinner />}
            {pending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </form>
  );
}
