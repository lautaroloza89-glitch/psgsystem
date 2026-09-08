"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BorrarTareaButton } from "@/components/tareas/BorrarTareaButton";

/**
 * «Editar» y «Borrar» dejan de ser botones sueltos en el cuerpo del detalle y
 * pasan al «⋯» del header: lo que se usa todos los días es cambiar el estado y
 * comentar, no editar la estructura de la tarea.
 */
export function MenuTarea({
  tareaId,
  puedeEditar,
  puedeBorrar,
}: {
  tareaId: string;
  puedeEditar: boolean;
  puedeBorrar: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;

    function alClickear(e: MouseEvent) {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    }
    function alTeclear(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", alClickear);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("mousedown", alClickear);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto]);

  if (!puedeEditar && !puedeBorrar) return null;

  return (
    <div ref={contenedor} className="relative flex-none">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-label="Más acciones"
        className="flex h-11 w-11 items-center justify-center rounded-md text-xl leading-none text-text-subtle transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <span aria-hidden="true">⋯</span>
      </button>

      {abierto && (
        <div className="absolute right-0 top-12 z-20 w-52 rounded-lg border border-border bg-surface p-1 shadow-lg">
          {puedeEditar && (
            <Link
              href={`/tareas/${tareaId}/editar`}
              className="block rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              Editar tarea
            </Link>
          )}
          {puedeBorrar && (
            <BorrarTareaButton tareaId={tareaId} />
          )}
        </div>
      )}
    </div>
  );
}
