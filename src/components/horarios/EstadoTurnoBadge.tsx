import type { EstadoTurno } from "@/types";

const ESTILOS: Record<EstadoTurno, string> = {
  Activo: "bg-green-100 text-green-800",
  Cancelado: "bg-red-100 text-red-800",
};

export function EstadoTurnoBadge({ estado }: { estado: EstadoTurno }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ESTILOS[estado]}`}
    >
      {estado}
    </span>
  );
}
