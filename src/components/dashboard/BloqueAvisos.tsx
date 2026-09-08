import Link from "next/link";
import { Icono } from "@/components/ui/Icono";
import type { Aviso, TonoAviso } from "@/lib/dashboard/inicio";

/**
 * «Requiere tu atención» / «Tu día»: reemplaza los cuatro `StatCard`.
 *
 * La diferencia con los contadores no es visual: cada línea **lleva a algún
 * lado** y solo aparece si hay algo que hacer. «Tareas en progreso» no está
 * porque no pide nada de nadie.
 */

const TONOS: Record<TonoAviso, string> = {
  urgente: "bg-error-50 text-error-600",
  atencion: "bg-warning-50 text-warning-700",
  calmo: "bg-primary-50 text-primary-600",
};

export function BloqueAvisos({ titulo, avisos }: { titulo: string; avisos: Aviso[] }) {
  return (
    <section
      aria-labelledby="avisos-titulo"
      className="overflow-hidden rounded-xl border border-border bg-surface"
    >
      <h2 id="avisos-titulo" className="px-4 pt-4 text-base font-semibold">
        {titulo}
      </h2>
      <ul className="mt-2 divide-y divide-border">
        {avisos.map((aviso) => (
          <li key={`${aviso.href}-${aviso.titulo}`}>
            <Link
              href={aviso.href}
              className="flex items-center gap-3 px-4 py-3 transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
            >
              <span
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${TONOS[aviso.tono]}`}
              >
                <Icono nombre={aviso.icono} className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold leading-snug">{aviso.titulo}</span>
                <span className="block text-sm text-text-subtle">{aviso.detalle}</span>
              </span>
              <span aria-hidden="true" className="flex-none text-text-subtle">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
