"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { EstadoAlumna } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { normalizarTexto } from "@/lib/utils/texto";

/**
 * El listado, para encontrar a una alumna en la pista con el celular en una
 * mano.
 *
 * Antes era una grilla de tarjetas de cinco líneas: dos alumnas por pantalla,
 * treinta pantallas de scroll para llegar a la S. Ahora es una fila por
 * alumna —inicial, apellido y grupo—, con el buscador fijo arriba y letras
 * como separador para orientarse. El DNI y la fecha de inscripción salen de
 * acá: el listado es para **encontrar** a alguien, el resto está en la ficha.
 */

const CLASE_FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const TABS_ESTADO: { label: string; value: EstadoAlumna | "Todas" }[] = [
  { label: "Activas", value: "activa" },
  { label: "Bajas", value: "baja" },
  { label: "Todas", value: "Todas" },
];

export interface AlumnaFila {
  id: string;
  apellido: string;
  nombre: string;
  dni: string | null;
  estado: EstadoAlumna;
  grupoId: string | null;
  grupoNombre: string;
  /** Semanas seguidas sin venir, si llegan al umbral de aviso. */
  semanasSinVenir: number | null;
}

function inicialesDe(apellido: string, nombre: string): string {
  return `${apellido.charAt(0)}${nombre.charAt(0)}`.toUpperCase();
}

export function AlumnasListClient({
  alumnas,
  grupos,
}: {
  alumnas: AlumnaFila[];
  grupos: { id: string; nombre: string }[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [estado, setEstado] = useState<EstadoAlumna | "Todas">("activa");
  const [opcionesAbiertas, setOpcionesAbiertas] = useState(false);

  const filtradas = useMemo(() => {
    const busquedaNormalizada = normalizarTexto(busqueda.trim());
    return alumnas
      .filter((a) => estado === "Todas" || a.estado === estado)
      .filter((a) => !grupoId || a.grupoId === grupoId)
      .filter((a) => {
        if (!busquedaNormalizada) return true;
        const campos = [a.apellido, a.nombre, a.dni ?? ""].map(normalizarTexto);
        return campos.some((campo) => campo.includes(busquedaNormalizada));
      });
  }, [alumnas, busqueda, grupoId, estado]);

  // Las filas ya vienen ordenadas por apellido del server: alcanza con marcar
  // dónde cambia la inicial.
  const conSeparadores = useMemo(() => {
    let ultimaLetra = "";
    return filtradas.map((alumna) => {
      const letra = alumna.apellido.charAt(0).toUpperCase();
      const nueva = letra !== ultimaLetra;
      ultimaLetra = letra;
      return { alumna, letra: nueva ? letra : null };
    });
  }, [filtradas]);

  if (alumnas.length === 0) {
    return <EmptyState mensaje="Todavía no hay alumnas cargadas." />;
  }

  const hayBusqueda = busqueda.trim().length > 0;

  return (
    <div className="space-y-3">
      {/* El buscador queda pegado arriba al scrollear: es lo que se usa. */}
      <div className="sticky top-0 z-10 -mx-4 space-y-2 bg-bg px-4 pb-2 pt-1 sm:-mx-8 sm:px-8">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Apellido, nombre o DNI"
          aria-label="Buscar alumna"
          className={`w-full rounded-lg border border-border-strong px-3 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard focus:border-primary-500 ${CLASE_FOCO}`}
        />

        {/* Chips en vez del desplegable nativo, que en iOS son dos toques y
            una rueda. Cinco grupos entran en una tira deslizable. */}
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

      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-text-subtle">
          {hayBusqueda
            ? `${filtradas.length} ${filtradas.length === 1 ? "resultado" : "resultados"}`
            : `Mostrando ${filtradas.length} de ${alumnas.length}`}
        </p>
        <button
          type="button"
          onClick={() => setOpcionesAbiertas((v) => !v)}
          aria-expanded={opcionesAbiertas}
          className={`rounded px-2 py-1 text-sm font-medium text-primary-600 hover:text-primary-700 ${CLASE_FOCO}`}
        >
          {TABS_ESTADO.find((t) => t.value === estado)?.label ?? "Activas"} ▾
        </button>
      </div>

      {/* Activas / Bajas / Todas dejan de ocupar la primera línea de la
          pantalla: arranca en Activas, que es el 90% de los casos. */}
      {opcionesAbiertas && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-surface p-3">
          {TABS_ESTADO.map((tab) => (
            <Chip
              key={tab.value}
              activo={estado === tab.value}
              onClick={() => {
                setEstado(tab.value);
                setOpcionesAbiertas(false);
              }}
            >
              {tab.label}
            </Chip>
          ))}
        </div>
      )}

      {filtradas.length === 0 ? (
        <EmptyState mensaje="Ninguna alumna coincide con la búsqueda." />
      ) : (
        <ul className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
          {conSeparadores.map(({ alumna, letra }) => (
            <li key={alumna.id}>
              {letra && !hayBusqueda && (
                <p className="bg-surface-muted px-4 py-1 text-sm font-semibold uppercase tracking-wide text-text-subtle">
                  {letra}
                </p>
              )}
              <Link
                href={`/alumnas/${alumna.id}`}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
              >
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-text-subtle"
                >
                  {inicialesDe(alumna.apellido, alumna.nombre)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium leading-snug">
                    {alumna.apellido}, {alumna.nombre}
                  </span>
                  <span className="block truncate text-sm text-text-subtle">
                    {alumna.grupoNombre}
                    {/* Solo se marca la excepción: el estado «Activa» ya lo
                        dice el filtro, repetirlo 58 veces no informa. */}
                    {alumna.estado !== "activa" && " · de baja"}
                    {alumna.semanasSinVenir !== null &&
                      ` · ${alumna.semanasSinVenir} semanas sin venir`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
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
      aria-pressed={activo}
      onClick={onClick}
      className={`h-9 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard ${CLASE_FOCO} ${
        activo
          ? "border-primary-500 bg-primary-500 text-on-primary"
          : "border-border bg-surface text-text-subtle hover:border-border-strong hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}
