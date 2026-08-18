import type { EstadoTarea } from "@/types";

const ESTILOS: Record<EstadoTarea, string> = {
  Pendiente: "bg-amber-100 text-amber-800",
  "En progreso": "bg-blue-100 text-blue-800",
  Completada: "bg-green-100 text-green-800",
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
