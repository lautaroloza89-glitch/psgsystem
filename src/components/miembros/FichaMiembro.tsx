"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  cambiarCargo,
  cambiarDictaClases,
  cambiarRol,
  darDeBaja,
} from "@/app/(dashboard)/miembros/actions";
import { nombreDeRol } from "@/lib/miembros/equipo";
import type { Rol } from "@/types";

const ROLES: Rol[] = ["Admin", "Head Coach", "Secretaria", "Profesor", "Empleado", "Patinador"];

const CLASE_FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

/**
 * Rol, cargo y «da clases» — lo que hasta ahora se cambiaba a mano en la base.
 *
 * `editable` distingue a Admin del resto: Head Coach y Secretaria ven la misma
 * ficha en lectura. No es solo estética, las actions vuelven a validar el rol y
 * la RLS también.
 */
export function FichaMiembro({
  usuarioId,
  esUnoMismo,
  rol,
  cargo,
  dictaClases,
  editable,
}: {
  usuarioId: string;
  esUnoMismo: boolean;
  rol: Rol;
  cargo: string | null;
  dictaClases: boolean;
  editable: boolean;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editandoCargo, setEditandoCargo] = useState(false);
  const [borradorCargo, setBorradorCargo] = useState(cargo ?? "");
  const [confirmandoBaja, setConfirmandoBaja] = useState(false);

  function ejecutar(accion: () => Promise<{ error?: string }>, alTerminar?: () => void) {
    setError(null);
    startTransition(async () => {
      const resultado = await accion();
      if (resultado.error) {
        setError(resultado.error);
        return;
      }
      alTerminar?.();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <dl className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <dt className="text-sm text-text-subtle">Rol</dt>
            <dd className="font-semibold">{nombreDeRol(rol)}</dd>
          </div>
          {editable && !esUnoMismo && (
            <select
              aria-label="Cambiar rol"
              value={rol}
              disabled={pendiente}
              onChange={(e) => ejecutar(() => cambiarRol(usuarioId, e.target.value))}
              className={`rounded-md border border-border bg-surface px-2 py-1.5 text-sm ${CLASE_FOCO}`}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {nombreDeRol(r)}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <dt className="text-sm text-text-subtle">Cargo</dt>
            {editandoCargo ? (
              <dd className="mt-1 flex gap-2">
                <input
                  autoFocus
                  aria-label="Cargo"
                  value={borradorCargo}
                  disabled={pendiente}
                  onChange={(e) => setBorradorCargo(e.target.value)}
                  placeholder="Sin cargo"
                  className={`min-w-0 flex-1 rounded-md border border-border bg-surface px-2 py-1.5 text-sm ${CLASE_FOCO}`}
                />
                <button
                  type="button"
                  disabled={pendiente}
                  onClick={() =>
                    ejecutar(
                      () => cambiarCargo(usuarioId, borradorCargo),
                      () => setEditandoCargo(false)
                    )
                  }
                  className={`rounded-md bg-primary-500 px-3 py-1.5 text-sm font-medium text-on-primary hover:bg-primary-600 ${CLASE_FOCO}`}
                >
                  Guardar
                </button>
              </dd>
            ) : (
              <dd className="font-semibold">{cargo ?? "Sin cargo"}</dd>
            )}
          </div>
          {editable && !editandoCargo && (
            <button
              type="button"
              onClick={() => {
                setBorradorCargo(cargo ?? "");
                setEditandoCargo(true);
              }}
              className={`flex-none rounded px-1 text-sm font-medium text-primary-600 hover:text-primary-700 ${CLASE_FOCO}`}
            >
              {cargo ? "Cambiar" : "Agregar"}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <dt className="font-semibold">Da clases</dt>
            <dd className="text-sm text-text-subtle">
              Aparece como profesora asignable en las clases
            </dd>
          </div>
          {editable ? (
            <button
              type="button"
              role="switch"
              aria-checked={dictaClases}
              aria-label="Da clases"
              disabled={pendiente}
              onClick={() => ejecutar(() => cambiarDictaClases(usuarioId, !dictaClases))}
              className={`relative h-6 w-11 flex-none rounded-full transition-colors duration-[var(--duration-fast)] ease-standard ${CLASE_FOCO} ${
                dictaClases ? "bg-primary-500" : "bg-neutral-300"
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all duration-[var(--duration-fast)] ease-standard ${
                  dictaClases ? "left-[1.375rem]" : "left-0.5"
                }`}
              />
            </button>
          ) : (
            <span className="flex-none text-sm font-medium">{dictaClases ? "Sí" : "No"}</span>
          )}
        </div>
      </dl>

      {error && (
        <p role="alert" className="text-sm font-medium text-error-600">
          {error}
        </p>
      )}

      {editable && !esUnoMismo && (
        <div className="rounded-xl border border-border bg-surface p-4">
          {confirmandoBaja ? (
            <div className="space-y-3">
              <p className="text-sm">
                Deja de figurar en los listados y en los selectores. Sus tareas, sus clases y
                los pagos que registró se conservan con su nombre.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pendiente}
                  onClick={() => ejecutar(() => darDeBaja(usuarioId), () => router.push("/miembros"))}
                  className={`rounded-md bg-error-600 px-3 py-2 text-sm font-medium text-white hover:bg-error-700 ${CLASE_FOCO}`}
                >
                  Dar de baja
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmandoBaja(false)}
                  className={`rounded-md px-3 py-2 text-sm font-medium text-text-subtle hover:text-text ${CLASE_FOCO}`}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmandoBaja(true)}
              className={`rounded px-1 text-sm font-medium text-error-600 hover:text-error-700 ${CLASE_FOCO}`}
            >
              Dar de baja
            </button>
          )}
        </div>
      )}
    </div>
  );
}
