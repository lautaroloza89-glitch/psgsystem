import Link from "next/link";
import type { EstadoTarea } from "@/types";

const OPCIONES: { label: string; value: EstadoTarea | "Todas" }[] = [
  { label: "Todas", value: "Todas" },
  { label: "Pendiente", value: "Pendiente" },
  { label: "En progreso", value: "En progreso" },
  { label: "Completada", value: "Completada" },
];

export function FiltroEstadoTabs({ actual }: { actual: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPCIONES.map((opcion) => {
        const activo = actual === opcion.value;
        return (
          <Link
            key={opcion.value}
            href={
              opcion.value === "Todas"
                ? "/tareas"
                : `/tareas?estado=${encodeURIComponent(opcion.value)}`
            }
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
              activo
                ? "border-primary-500 bg-primary-500 text-on-primary hover:bg-primary-600"
                : "border-border text-text-muted hover:border-neutral-400 hover:bg-surface-muted"
            }`}
          >
            {opcion.label}
          </Link>
        );
      })}
    </div>
  );
}
