import Link from "next/link";
import type { EstadoTarea } from "@/types";
import { EstadoBadge } from "./EstadoBadge";
import { formatFecha } from "@/lib/utils/date";

export interface TareaCardData {
  id: string;
  titulo: string;
  estado: EstadoTarea;
  fecha_vencimiento: string | null;
  asignados: { nombre: string }[];
}

export function TareaCard({ tarea }: { tarea: TareaCardData }) {
  return (
    <Link
      href={`/tareas/${tarea.id}`}
      className="block rounded-lg border border-border bg-surface p-5 shadow-xs transition duration-[var(--duration-base)] ease-standard hover:border-border-strong hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-semibold">{tarea.titulo}</h2>
        <EstadoBadge estado={tarea.estado} />
      </div>
      <p className="mt-2 text-sm text-text-subtle">
        Vence: {formatFecha(tarea.fecha_vencimiento)}
      </p>
      {tarea.asignados.length > 0 && (
        <p className="mt-1 text-sm text-text-subtle">
          {tarea.asignados.map((a) => a.nombre).join(", ")}
        </p>
      )}
    </Link>
  );
}
