"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import type { FormState } from "@/app/(dashboard)/horarios/actions";
import type { Rol, TipoTurno, User } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { ChipOpcion } from "@/components/ui/ChipOpcion";
import { ChipsResponsables } from "@/components/tareas/ChipsResponsables";
import { SelectorFechaDeClase } from "./SelectorFechaDeClase";
import { diaIsoDeFecha, nombreDia } from "@/lib/utils/date";

const INPUT_CLASS =
  "w-full rounded-md border border-border-strong px-3 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-focus-ring";

const TIPOS: TipoTurno[] = ["Patín", "Preparación física"];

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

/**
 * Edición de una clase/planificación ya creada. La creación vive en
 * `/horarios/grupos/[grupoId]/planificar` (`PlanificarForm`).
 *
 * Son dos formularios distintos a propósito —crear aplica el mismo contenido a
 * varias fechas de un mes, editar toca una sola clase—, pero se tocan igual:
 * mismos chips para grupo, tipo y profesoras, y el mismo textarea. Antes este
 * tenía dos `select` nativos y el checklist de tres líneas por persona, así
 * que dos pantallas casi iguales se manejaban de dos maneras distintas.
 */
export function TurnoForm({
  action,
  profile,
  profesores,
  grupos,
  defaultValues,
  anioInicial,
  mesInicial,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  profile: { id: string; rol: Rol };
  profesores: Pick<User, "id" | "nombre" | "rol" | "cargo">[];
  grupos: GrupoOption[];
  defaultValues?: TurnoFormDefaultValues;
  /** Mes que abre el selector de fecha. Del servidor, para no depender del reloj del navegador. */
  anioInicial: number;
  mesInicial: number;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [grupoId, setGrupoId] = useState(defaultValues?.grupo_id ?? "");
  const [fecha, setFecha] = useState(defaultValues?.fecha ?? "");
  const [tipo, setTipo] = useState<TipoTurno>(defaultValues?.tipo ?? "Patín");

  const grupoSeleccionado = useMemo(
    () => grupos.find((g) => g.id === grupoId) ?? null,
    [grupos, grupoId]
  );

  /** Los días ISO que entrena el grupo elegido, que son las fechas ofrecibles. */
  const diasDelGrupo = useMemo(() => {
    const dias = new Set<number>();
    for (const bloque of grupoSeleccionado?.bloques ?? []) {
      for (const dia of bloque.dias) dias.add(dia);
    }
    return [...dias].sort((a, b) => a - b);
  }, [grupoSeleccionado]);

  /**
   * Cambiar de grupo cambia los días válidos, así que la fecha elegida deja de
   * servir salvo que el grupo nuevo también entrene ese día. Limpiarla evita
   * mandar una combinación que el servidor va a rechazar.
   */
  function cambiarGrupo(nuevo: string) {
    setGrupoId(nuevo);
    const bloques = grupos.find((g) => g.id === nuevo)?.bloques ?? [];
    const sigueSirviendo =
      !!fecha && bloques.some((b) => b.dias.includes(diaIsoDeFecha(fecha)));
    if (!sigueSirviendo) setFecha("");
  }

  // El horario ya no se elige a mano: lo determina el día de semana de la
  // fecha elegida (Parche "unificar creación de planificaciones").
  const bloqueSeleccionado = useMemo(() => {
    if (!grupoSeleccionado || !fecha) return null;
    const diaIso = diaIsoDeFecha(fecha);
    return grupoSeleccionado.bloques.find((b) => b.dias.includes(diaIso)) ?? null;
  }, [grupoSeleccionado, fecha]);

  const mostrarHintLegacy = !defaultValues?.grupo_id && !!defaultValues?.grupo_legacy;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="grupo_id" value={grupoId} />
      <input type="hidden" name="tipo" value={tipo} />

      <fieldset className="space-y-2">
        <legend className="text-label font-medium">Grupo</legend>
        <div className="flex flex-wrap gap-2">
          {grupos.map((g) => (
            <ChipOpcion key={g.id} activo={grupoId === g.id} onClick={() => cambiarGrupo(g.id)}>
              {g.nombre}
            </ChipOpcion>
          ))}
        </div>
        {mostrarHintLegacy && (
          <p className="text-sm text-text-subtle">
            Texto anterior (sin mapear): «{defaultValues.grupo_legacy}»
          </p>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-label font-medium">Fecha</legend>
        {grupoId ? (
          <SelectorFechaDeClase
            name="fecha"
            diasDisponibles={diasDelGrupo}
            anioInicial={anioInicial}
            mesInicial={mesInicial}
            value={fecha}
            onChange={setFecha}
            fechaExtra={defaultValues?.fecha}
          />
        ) : (
          <p className="text-sm text-text-subtle">Elegí un grupo para ver sus fechas de clase.</p>
        )}
        {bloqueSeleccionado && (
          <p className="text-sm text-text-subtle">
            {nombreDia(diaIsoDeFecha(fecha))} de {formatHora(bloqueSeleccionado.hora_inicio)} a{" "}
            {formatHora(bloqueSeleccionado.hora_fin)}.
          </p>
        )}
      </fieldset>

      {profile.rol === "Admin" || profile.rol === "Head Coach" ? (
        <fieldset className="space-y-2">
          <legend className="text-label font-medium">Profesor/a a cargo</legend>
          <ChipsResponsables
            usuarios={profesores}
            seleccionados={defaultValues?.profesoresIds}
            name="profesores"
          />
        </fieldset>
      ) : (
        <p className="text-sm text-text-subtle">Esta clase queda asignada a vos como profesor.</p>
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="planificacion" className="text-label font-medium">
            La planificación
          </label>
          <div className="flex gap-2">
            {TIPOS.map((t) => (
              <ChipOpcion key={t} activo={tipo === t} onClick={() => setTipo(t)}>
                {t === "Preparación física" ? "Prep. física" : t}
              </ChipOpcion>
            ))}
          </div>
        </div>
        <textarea
          id="planificacion"
          name="planificacion"
          rows={8}
          defaultValue={defaultValues?.planificacion ?? ""}
          placeholder="Pegá acá lo que armaste. Entiende títulos, negritas y listas."
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
        disabled={pending || !grupoId || !fecha}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-500 py-3 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {pending && <Spinner />}
        {pending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
