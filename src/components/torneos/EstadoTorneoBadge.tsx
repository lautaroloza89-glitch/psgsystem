import type { EstadoTorneo } from "@/lib/torneos/fechas";

const ESTILOS: Record<EstadoTorneo, string> = {
  Próximo: "bg-info-100 text-info-800",
  "En curso": "bg-success-100 text-success-800",
  Pasado: "bg-neutral-100 text-neutral-700",
};

export function EstadoTorneoBadge({ estado }: { estado: EstadoTorneo }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-sm font-medium ${ESTILOS[estado]}`}
    >
      {estado}
    </span>
  );
}
