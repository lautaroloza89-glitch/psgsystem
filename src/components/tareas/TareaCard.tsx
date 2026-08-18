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
      className="block rounded-lg border border-black/10 p-4 hover:border-black/30"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-medium">{tarea.titulo}</h2>
        <EstadoBadge estado={tarea.estado} />
      </div>
      <p className="mt-2 text-sm text-black/50">
        Vence: {formatFecha(tarea.fecha_vencimiento)}
      </p>
      {tarea.asignados.length > 0 && (
        <p className="mt-1 text-sm text-black/50">
          {tarea.asignados.map((a) => a.nombre).join(", ")}
        </p>
      )}
    </Link>
  );
}
