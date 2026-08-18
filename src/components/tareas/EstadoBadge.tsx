import type { EstadoTarea } from "@/types";

const ESTILOS: Record<EstadoTarea, string> = {
  Pendiente: "bg-warning-100 text-warning-800",
  "En progreso": "bg-info-100 text-info-800",
  Completada: "bg-success-100 text-success-800",
};

export function EstadoBadge({ estado }: { estado: EstadoTarea }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ESTILOS[estado]}`}
    >
      {estado}
    </span>
  );
}
