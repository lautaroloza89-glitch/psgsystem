"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import type { FormState } from "@/app/(dashboard)/horarios/actions";
import type { Rol, TipoTurno, User } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { AsignadosChecklist } from "@/components/ui/AsignadosChecklist";
import { diaIsoDeFecha, nombreDia } from "@/lib/utils/date";

const INPUT_CLASS =
  "w-full rounded-md border border-border-strong px-3 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-focus-ring";

function formatHora(hora: string): string {
  return hora.slice(0, 5);
}

export interface GrupoHorarioOption {
  id: string;
  dias: number[];
  hora_inicio: string;
  hora_fin: string;
}

export interface GrupoOption {
  id: string;
  nombre: string;
  bloques: GrupoHorarioOption[];
}

export interface TurnoFormDefaultValues {
  fecha: string;
  grupo_id: string;
  /** Solo para mostrar el texto libre viejo como ayuda mientras no se eligió un grupo real. */
  grupo_legacy: string | null;
  profesoresIds: string[];
  tipo: TipoTurno;
  planificacion: string | null;
}

const initialState: FormState = { error: null };

/** Edición de una clase/planificación ya creada. La creación vive en `/horarios/grupos/[grupoId]/planificar` (PlanificarForm). */
export function TurnoForm({
  action,
  profile,
  profesores,
  grupos,
  defaultValues,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  profile: { id: string; rol: Rol };
  profesores: Pick<User, "id" | "nombre" | "rol" | "cargo">[];
  grupos: GrupoOption[];
  defaultValues?: TurnoFormDefaultValues;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [grupoId, setGrupoId] = useState(defaultValues?.grupo_id ?? "");
  const [fecha, setFecha] = useState(defaultValues?.fecha ?? "");

  const grupoSeleccionado = useMemo(
    () => grupos.find((g) => g.id === grupoId) ?? null,
    [grupos, grupoId]
  );

  // El horario ya no se elige a mano: lo determina el día de semana de la
  // fecha elegida (Parche "unificar creación de planificaciones").
  const bloqueSeleccionado = useMemo(() => {
    if (!grupoSeleccionado || !fecha) return null;
    const diaIso = diaIsoDeFecha(fecha);
    return grupoSeleccionado.bloques.find((b) => b.dias.includes(diaIso)) ?? null;
  }, [grupoSeleccionado, fecha]);

  const mostrarHintLegacy =
    !defaultValues?.grupo_id && !!defaultValues?.grupo_legacy;

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="fecha" className="text-label font-medium">
          Fecha
        </label>
        <input
          id="fecha"
          name="fecha"
          type="date"
          required
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="grupo_id" className="text-label font-medium">
          Grupo
        </label>
        <select
          id="grupo_id"
          name="grupo_id"
          required
          value={grupoId}
          onChange={(e) => setGrupoId(e.target.value)}
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
        {mostrarHintLegacy && (
          <p className="text-sm text-text-subtle">
            Texto anterior (sin mapear): &quot;{defaultValues!.grupo_legacy}&quot;
          </p>
        )}
      </div>

      {grupoId && fecha && (
        <p
          className={
            bloqueSeleccionado ? "text-sm text-text-muted" : "text-sm text-error-600"
          }
        >
          {bloqueSeleccionado
            ? `Horario: ${nombreDia(diaIsoDeFecha(fecha))} ${formatHora(
                bloqueSeleccionado.hora_inicio
              )}–${formatHora(bloqueSeleccionado.hora_fin)}`
            : "Ese grupo no tiene clase ese día de la semana."}
        </p>
      )}

      {profile.rol === "Admin" || profile.rol === "Head Coach" ? (
        <div className="space-y-1.5">
          <span className="text-label font-medium">Profesores</span>
          <AsignadosChecklist
            usuarios={profesores}
            seleccionados={defaultValues?.profesoresIds}
            name="profesores"
          />
        </div>
      ) : (
        <p className="text-sm text-text-subtle">
          Esta clase queda asignada a vos como profesor.
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="tipo" className="text-label font-medium">
          Tipo de clase
        </label>
        <select
          id="tipo"
          name="tipo"
          defaultValue={defaultValues?.tipo ?? "Patín"}
          className={INPUT_CLASS}
        >
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
          rows={8}
          defaultValue={defaultValues?.planificacion ?? ""}
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
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-500 py-2.5 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {pending && <Spinner />}
        {pending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
