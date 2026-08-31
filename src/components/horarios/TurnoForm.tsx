"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import type { FormState } from "@/app/(dashboard)/horarios/actions";
import type { Rol, User } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { AsignadosChecklist } from "@/components/ui/AsignadosChecklist";

const INPUT_CLASS =
  "w-full rounded-md border border-border-strong px-3 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-focus-ring";

const DIAS_NOMBRE: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

function formatDias(dias: number[]): string {
  const nombres = dias.map((d) => DIAS_NOMBRE[d] ?? "?");
  if (nombres.length <= 1) return nombres.join("");
  return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}

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
  grupo_horario_id: string;
  /** Solo para mostrar el texto libre viejo como ayuda mientras no se eligió un grupo real. */
  grupo_legacy: string | null;
  profesoresIds: string[];
}

const initialState: FormState = { error: null };

export function TurnoForm({
  action,
  profile,
  profesores,
  grupos,
  defaultValues,
  modo,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  profile: { id: string; rol: Rol };
  profesores: Pick<User, "id" | "nombre" | "rol" | "cargo">[];
  grupos: GrupoOption[];
  defaultValues?: TurnoFormDefaultValues;
  modo: "crear" | "editar";
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [grupoId, setGrupoId] = useState(defaultValues?.grupo_id ?? "");
  const [bloqueId, setBloqueId] = useState(defaultValues?.grupo_horario_id ?? "");

  const grupoSeleccionado = useMemo(
    () => grupos.find((g) => g.id === grupoId) ?? null,
    [grupos, grupoId]
  );
  const bloques = grupoSeleccionado?.bloques ?? [];
  const bloqueSeleccionado = bloques.find((b) => b.id === bloqueId) ?? null;

  function handleGrupoChange(nuevoGrupoId: string) {
    setGrupoId(nuevoGrupoId);
    const nuevosBloques = grupos.find((g) => g.id === nuevoGrupoId)?.bloques ?? [];
    setBloqueId(nuevosBloques.length === 1 ? nuevosBloques[0].id : "");
  }

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
          defaultValue={defaultValues?.fecha}
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
          onChange={(e) => handleGrupoChange(e.target.value)}
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

      {bloques.length > 1 ? (
        <div className="space-y-1.5">
          <label htmlFor="grupo_horario_id" className="text-label font-medium">
            Horario
          </label>
          <select
            id="grupo_horario_id"
            name="grupo_horario_id"
            required
            value={bloqueId}
            onChange={(e) => setBloqueId(e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="" disabled>
              Elegí un horario
            </option>
            {bloques.map((b) => (
              <option key={b.id} value={b.id}>
                {formatDias(b.dias)} {formatHora(b.hora_inicio)}–{formatHora(b.hora_fin)}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <>
          <input type="hidden" name="grupo_horario_id" value={bloqueId} />
          {bloqueSeleccionado && (
            <p className="text-sm text-text-muted">
              Horario: {formatDias(bloqueSeleccionado.dias)}{" "}
              {formatHora(bloqueSeleccionado.hora_inicio)}–{formatHora(bloqueSeleccionado.hora_fin)}
            </p>
          )}
        </>
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
        {pending ? "Guardando..." : modo === "crear" ? "Crear clase" : "Guardar cambios"}
      </button>
    </form>
  );
}
