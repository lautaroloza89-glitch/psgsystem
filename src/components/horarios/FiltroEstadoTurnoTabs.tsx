import Link from "next/link";
import type { EstadoTurno } from "@/types";

const OPCIONES: { label: string; value: EstadoTurno | "Todas" }[] = [
  { label: "Todas", value: "Todas" },
  { label: "Activo", value: "Activo" },
  { label: "Cancelado", value: "Cancelado" },
];

export function FiltroEstadoTurnoTabs({ actual }: { actual: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPCIONES.map((opcion) => {
        const activo = actual === opcion.value;
        return (
          <Link
            key={opcion.value}
            href={
              opcion.value === "Todas"
                ? "/horarios"
                : `/horarios?estado=${encodeURIComponent(opcion.value)}`
            }
            className={`rounded-full border px-3 py-1 text-sm ${
              activo
                ? "border-black bg-black text-white"
                : "border-black/20 text-black/70 hover:border-black/40"
            }`}
          >
            {opcion.label}
          </Link>
        );
      })}
    </div>
  );
}
