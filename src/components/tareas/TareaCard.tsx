import Link from "next/link";
import type { EstadoTarea, Rol } from "@/types";
import { EstadoBadge } from "./EstadoBadge";
import { UsuarioRolCargo } from "@/components/ui/UsuarioRolCargo";
import { formatFecha } from "@/lib/utils/date";

export interface TareaCardData {
  id: string;
  titulo: string;
  estado: EstadoTarea;
  fecha_vencimiento: string | null;
  asignados: { nombre: string; rol: Rol; cargo: string | null }[];
}

export function TareaCard({
  tarea,
  headingLevel = "h2",
}: {
  tarea: TareaCardData;
  /** "h3" cuando la tarjeta va anidada bajo una sección ya encabezada por un h2 (ej. Dashboard). */
  headingLevel?: "h2" | "h3";
}) {
  const Titulo = headingLevel;
  return (
    <Link
      href={`/tareas/${tarea.id}`}
      className="block rounded-lg border border-border bg-surface p-5 shadow-xs transition duration-[var(--duration-base)] ease-standard hover:border-border-strong hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <div className="flex items-start justify-between gap-2">
        <Titulo className="text-lg font-semibold">{tarea.titulo}</Titulo>
        <EstadoBadge estado={tarea.estado} />
      </div>
      <p className="mt-2 text-sm text-text-subtle">
        Vence: {formatFecha(tarea.fecha_vencimiento)}
      </p>
      {tarea.asignados.length > 0 && (
        <div className="mt-1 space-y-2">
          {tarea.asignados.map((a, i) => (
            <UsuarioRolCargo key={i} nombre={a.nombre} rol={a.rol} cargo={a.cargo} />
          ))}
        </div>
      )}
    </Link>
  );
}
