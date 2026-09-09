import { Icono } from "@/components/ui/Icono";
import { MarkdownText } from "@/components/ui/MarkdownText";

/**
 * El objetivo del mes, como chip que abre un panel.
 *
 * Antes era una tarjeta desplegada que ocupaba media pantalla en cada grupo y
 * cada mes, y había que pasarla siempre para llegar a la primera clase. Sigue
 * desplegado en la pantalla del grupo, donde sí es el contexto principal; en la
 * lista de clases baja a chip.
 *
 * Es un `<details>` y no un panel con estado: abre y cierra sin JavaScript,
 * mismo criterio que los chips de responsables de Tareas.
 */
export function ChipObjetivoMes({ objetivo }: { objetivo: string | null }) {
  if (!objetivo) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1 text-sm text-text-subtle">
        Sin objetivo
      </span>
    );
  }

  return (
    <details className="group w-full">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3 py-1 text-sm font-medium text-text-muted transition-colors duration-[var(--duration-fast)] ease-standard hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
        <Icono nombre="target" className="h-4 w-4" />
        Objetivo del mes
      </summary>
      {/* Con scroll adentro: en la lista el objetivo es un dato de apoyo, y
          uno largo abierto empujaría las clases que siguen fuera de la
          pantalla — que es justo lo que este chip vino a evitar. */}
      <div className="mt-2 max-h-56 overflow-y-auto overscroll-contain rounded-lg border border-border bg-surface-muted p-3">
        <MarkdownText texto={objetivo} />
      </div>
    </details>
  );
}
