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
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
              activo
                ? "border-primary-500 bg-primary-500 text-on-primary"
                : "border-border text-text-muted hover:border-neutral-400"
            }`}
          >
            {opcion.label}
          </Link>
        );
      })}
    </div>
  );
}
