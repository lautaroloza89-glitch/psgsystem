"use client";

import { useActionState, useMemo, useState } from "react";
import type { FormState } from "@/app/(dashboard)/horarios/actions";
import { Spinner } from "@/components/ui/spinner";
import { fechasDelMesPorDia, formatFecha, nombreDia } from "@/lib/utils/date";

const INPUT_CLASS =
  "w-full rounded-md border border-border-strong px-3 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-focus-ring";

const initialState: FormState = { error: null };

export function PlanificarForm({
  action,
  diasDisponibles,
  anio,
  mes,
  mesLabel,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  /** Días ISO (1=lunes...7=domingo) en los que el grupo tiene clase, según grupo_horarios. */
  diasDisponibles: number[];
  anio: number;
  mes: number;
  mesLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [diaIso, setDiaIso] = useState<number | "">(diasDisponibles[0] ?? "");

  const fechas = useMemo(
    () => (diaIso === "" ? [] : fechasDelMesPorDia(anio, mes, diaIso)),
    [anio, mes, diaIso]
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="mes" value={`${anio}-${String(mes).padStart(2, "0")}`} />

      <div className="space-y-1.5">
        <label htmlFor="dia" className="text-label font-medium">
          Día de la semana
        </label>
        <select
          id="dia"
          value={diaIso}
          onChange={(e) => setDiaIso(e.target.value === "" ? "" : Number(e.target.value))}
          className={INPUT_CLASS}
        >
          <option value="" disabled>
            Elegí un día
          </option>
          {diasDisponibles.map((d) => (
            <option key={d} value={d}>
              {nombreDia(d)}
            </option>
          ))}
        </select>
        <p className="text-sm text-text-subtle">Fechas de {mesLabel} con ese día.</p>
      </div>

      {fechas.length > 0 && (
        <fieldset key={diaIso} className="space-y-1.5">
          <legend className="text-label font-medium">Fechas</legend>
          <div className="space-y-2 rounded-md border border-border-strong p-3">
            {fechas.map((fecha) => (
              <label key={fecha} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="fechas" value={fecha} defaultChecked />
                {formatFecha(fecha)}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="space-y-1.5">
        <label htmlFor="tipo" className="text-label font-medium">
          Tipo de clase
        </label>
        <select id="tipo" name="tipo" defaultValue="Patín" className={INPUT_CLASS}>
          <option value="Patín">Patín</option>
          <option value="Preparación física">Preparación física</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="planificacion" className="text-label font-medium">
          Planificación
        </label>
        <textarea
          id="planificacion"
          name="planificacion"
          rows={10}
          required
          placeholder="Pegá acá la planificación (admite markdown: títulos, negritas, listas, tablas)."
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
        disabled={pending || fechas.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-500 py-2.5 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {pending && <Spinner />}
        {pending ? "Guardando..." : "Guardar planificación"}
      </button>
    </form>
  );
}
