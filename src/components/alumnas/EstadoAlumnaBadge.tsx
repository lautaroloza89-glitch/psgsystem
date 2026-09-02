import type { EstadoAlumna } from "@/types";

const ESTILOS: Record<EstadoAlumna, string> = {
  activa: "bg-success-100 text-success-800",
  baja: "bg-error-100 text-error-800",
};

const LABELS: Record<EstadoAlumna, string> = {
  activa: "Activa",
  baja: "Baja",
};

export function EstadoAlumnaBadge({ estado }: { estado: EstadoAlumna }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-sm font-medium ${ESTILOS[estado]}`}
    >
      {LABELS[estado]}
    </span>
  );
}
