"use client";

import { Fragment, createContext, useContext, useState } from "react";
import { coincideConBusqueda } from "@/lib/utils/texto";

/**
 * El buscador de alumnas de las listas de Pagos — uno solo, en vez de uno
 * escrito a mano por pantalla.
 *
 * Son tres piezas porque una pantalla puede tener un buscador y más de una
 * lista (Pendientes tiene los pagos sin verificar y los ya verificados):
 *
 * - `FiltroAlumnas` envuelve la zona y guarda lo que se escribió.
 * - `BuscadorAlumnas` es el campo.
 * - `ListaFiltrada` recibe las filas ya renderizadas en el servidor y muestra
 *   las que coinciden.
 *
 * Filtra en el cliente sobre lo que ya está cargado y **no reordena**: las
 * filas salen en el orden en que llegan, así que el orden y el agrupamiento
 * (las bajas al final, en Deudores) se deciden una sola vez, en el servidor.
 */

const FiltroContext = createContext<string>("");
const SetFiltroContext = createContext<(valor: string) => void>(() => {});

export function FiltroAlumnas({ children }: { children: React.ReactNode }) {
  const [busqueda, setBusqueda] = useState("");
  return (
    <SetFiltroContext.Provider value={setBusqueda}>
      <FiltroContext.Provider value={busqueda}>{children}</FiltroContext.Provider>
    </SetFiltroContext.Provider>
  );
}

const CLASE_FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

export function BuscadorAlumnas() {
  const busqueda = useContext(FiltroContext);
  const setBusqueda = useContext(SetFiltroContext);

  return (
    <input
      type="search"
      value={busqueda}
      onChange={(e) => setBusqueda(e.target.value)}
      placeholder="Buscar por apellido o nombre"
      aria-label="Buscar alumna"
      className={`w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard focus:border-primary-500 ${CLASE_FOCO}`}
    />
  );
}

export interface ItemFiltrable {
  /** Clave única de la fila (la alumna o el pago). */
  clave: string;
  apellido: string;
  nombre: string;
  /**
   * Si cambia respecto de la fila anterior, se muestra como subtítulo antes
   * de esta fila. Sirve para separar las bajas del resto sin partir la lista.
   */
  seccion?: string;
  /** El `<li>` completo, renderizado en el servidor. */
  fila: React.ReactNode;
}

export function ListaFiltrada({
  items,
  className,
}: {
  items: ItemFiltrable[];
  className?: string;
}) {
  const busqueda = useContext(FiltroContext);
  const visibles = items.filter((item) => coincideConBusqueda(busqueda, item));

  if (visibles.length === 0) {
    return (
      <p className="text-sm text-text-subtle">
        {busqueda.trim() ? "Ninguna alumna coincide con la búsqueda." : null}
      </p>
    );
  }

  return (
    <ul className={className}>
      {visibles.map((item, i) => {
        const nuevaSeccion = item.seccion && item.seccion !== visibles[i - 1]?.seccion;
        return (
          <Fragment key={item.clave}>
            {nuevaSeccion && (
              <li className="pt-2 text-sm font-semibold uppercase tracking-wide text-text-subtle">
                {item.seccion}
              </li>
            )}
            {item.fila}
          </Fragment>
        );
      })}
    </ul>
  );
}
