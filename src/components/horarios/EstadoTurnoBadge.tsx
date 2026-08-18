import type { EstadoTurno } from "@/types";

const ESTILOS: Record<EstadoTurno, string> = {
  Activo: "bg-success-100 text-success-800",
  Cancelado: "bg-error-100 text-error-800",
};

export function EstadoTurnoBadge({ estado }: { estado: EstadoTurno }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-sm font-medium ${ESTILOS[estado]}`}
    >
      {estado}
    </span>
  );
}
