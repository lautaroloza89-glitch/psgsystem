"use client";

import { useActionState, useMemo, useState } from "react";
import type { FormState } from "@/app/(dashboard)/torneos/actions";
import type { AlumnaConvocable } from "@/lib/torneos/convocatoria";
import { normalizarTexto } from "@/lib/utils/texto";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/EmptyState";

const CLASE_FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const initialState: FormState = { error: null };

/**
 * El listado desde el que se arma la lista de un torneo.
 *
 * Se busca por nombre y se filtra **por los grupos que el club ya tiene** —los
 * mismos de Alumnas y Asistencia—, sin categorías nuevas que mantener: los
 * grupos se arman por habilidad, que es el criterio con el que Luciana elige a
 * quién lleva. Acá solo se elige quién va; la categoría de competencia se
 * escribe después, en la lista de convocadas.
 *
 * **Sin filtro por edad.** La fecha de nacimiento es una columna de la planilla
 * que pide la organización, no un criterio de búsqueda.
 */
export function ConvocarAlumnasForm({
  action,
  alumnas,
  grupos,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  alumnas: AlumnaConvocable[];
  grupos: { id: string; nombre: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [busqueda, setBusqueda] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [elegidas, setElegidas] = useState<Set<string>>(new Set());

  const disponibles = useMemo(() => alumnas.filter((a) => !a.yaConvocada), [alumnas]);

  const filtradas = useMemo(() => {
    const texto = normalizarTexto(busqueda.trim());
    return disponibles
      .filter((a) => !grupoId || a.grupoId === grupoId)
      .filter((a) => {
        if (!texto) return true;
        return [a.apellido, a.nombre].map(normalizarTexto).some((c) => c.includes(texto));
      });
  }, [disponibles, busqueda, grupoId]);

  // Agrupadas por grupo del club, con el nombre como encabezado: es el eje con
  // el que se piensa la convocatoria.
  const porGrupo = useMemo(() => {
    const grupos = new Map<string, { nombre: string; alumnas: AlumnaConvocable[] }>();
    for (const alumna of filtradas) {
      const clave = alumna.grupoId ?? "sin-grupo";
      const actual = grupos.get(clave) ?? { nombre: alumna.grupoNombre, alumnas: [] };
      actual.alumnas.push(alumna);
      grupos.set(clave, actual);
    }
    return [...grupos.entries()];
  }, [filtradas]);

  function alternar(id: string) {
    const proximas = new Set(elegidas);
    if (proximas.has(id)) proximas.delete(id);
    else proximas.add(id);
    setElegidas(proximas);
  }

  const yaConvocadas = alumnas.length - disponibles.length;

  if (disponibles.length === 0) {
    return (
      <EmptyState
        mensaje={
          alumnas.length === 0
            ? "No hay alumnas activas para convocar."
            : "Todas las alumnas activas ya están convocadas a este torneo."
        }
      />
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      {[...elegidas].map((id) => (
        <input key={id} type="hidden" name="alumnas" value={id} />
      ))}

      <div className="sticky top-0 z-10 -mx-4 space-y-2 bg-bg px-4 pb-2 pt-1 sm:-mx-8 sm:px-8">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o apellido"
          aria-label="Buscar alumna"
          className={`w-full rounded-lg border border-border-strong px-3 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard focus:border-primary-500 ${CLASE_FOCO}`}
        />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <Chip activo={!grupoId} onClick={() => setGrupoId("")}>
            Todos
          </Chip>
          {grupos.map((g) => (
            <Chip key={g.id} activo={grupoId === g.id} onClick={() => setGrupoId(g.id)}>
              {g.nombre}
            </Chip>
          ))}
        </div>
      </div>

      {yaConvocadas > 0 && (
        <p className="text-sm text-text-subtle">
          {yaConvocadas === 1
            ? "1 alumna ya está en la lista y no aparece acá."
            : `${yaConvocadas} alumnas ya están en la lista y no aparecen acá.`}
        </p>
      )}

      {filtradas.length === 0 ? (
        <EmptyState mensaje="Ninguna alumna coincide con la búsqueda." />
      ) : (
        <div className="space-y-4 pb-4">
          {porGrupo.map(([clave, grupo]) => (
            <section key={clave} className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-subtle">
                {grupo.nombre} · {grupo.alumnas.length}
              </h2>
              <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
                {grupo.alumnas.map((alumna) => (
                  <li key={alumna.id}>
                    <label className="flex cursor-pointer items-center gap-3 p-4 transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted">
                      <input
                        type="checkbox"
                        checked={elegidas.has(alumna.id)}
                        onChange={() => alternar(alumna.id)}
                        className={`h-5 w-5 shrink-0 rounded accent-primary-500 ${CLASE_FOCO}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">
                          {alumna.apellido}, {alumna.nombre}
                        </span>
                        {/* La deuda avisa, no bloquea: se la puede seleccionar
                            igual — pasa seguido y se la lleva —, y la nota no
                            se va. La decisión es de la Head Coach. */}
                        {alumna.deuda && (
                          <span className="block text-sm text-error-600">{alumna.deuda}</span>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {state.error && (
        <p role="alert" aria-live="assertive" className="text-sm text-error-600">
          {state.error}
        </p>
      )}

      {/* Pie fijo, mismo patrón que tomar asistencia: cuenta lo elegido y
          confirma sin tener que volver arriba. */}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] -mx-4 flex items-center justify-between gap-3 border-t border-border bg-surface px-4 py-3 sm:-mx-8 sm:px-8">
        <p className="text-sm font-medium">
          {elegidas.size === 0
            ? "Ninguna seleccionada"
            : `${elegidas.size} ${elegidas.size === 1 ? "seleccionada" : "seleccionadas"}`}
        </p>
        <button
          type="submit"
          disabled={pending || elegidas.size === 0}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary-500 px-5 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          {pending && <Spinner />}
          {pending ? "Convocando..." : "Convocar"}
        </button>
      </div>
    </form>
  );
}

function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard ${CLASE_FOCO} ${
        activo
          ? "border-primary-500 bg-primary-500 text-on-primary"
          : "border-border text-text-muted hover:border-border-strong"
      }`}
    >
      {children}
    </button>
  );
}
