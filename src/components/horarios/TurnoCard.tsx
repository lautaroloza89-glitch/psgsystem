import Link from "next/link";
import type { EstadoTurno, Rol } from "@/types";
import { EstadoTurnoBadge } from "./EstadoTurnoBadge";
import { UsuarioRolCargo } from "@/components/ui/UsuarioRolCargo";
import { formatFecha } from "@/lib/utils/date";

export interface TurnoCardData {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  grupo_nivel: string;
  estado: EstadoTurno;
  profesor: { nombre: string; rol: Rol; cargo: string | null } | null;
}

export function TurnoCard({
  turno,
  headingLevel = "h2",
}: {
  turno: TurnoCardData;
  /** "h3" cuando la tarjeta va anidada bajo una sección ya encabezada por un h2 (ej. Dashboard). */
  headingLevel?: "h2" | "h3";
}) {
  const Titulo = headingLevel;
  return (
    <Link
      href={`/horarios/${turno.id}`}
      className="block rounded-lg border border-border bg-surface p-5 shadow-xs transition duration-[var(--duration-base)] ease-standard hover:border-border-strong hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <div className="flex items-start justify-between gap-2">
        <Titulo className="text-lg font-semibold">{turno.grupo_nivel}</Titulo>
        <EstadoTurnoBadge estado={turno.estado} />
      </div>
      <p className="mt-2 text-sm text-text-subtle">
        {formatFecha(turno.fecha)} · {turno.hora_inicio.slice(0, 5)}–{turno.hora_fin.slice(0, 5)}
      </p>
      {turno.profesor ? (
        <div className="mt-1">
          <UsuarioRolCargo
            nombre={turno.profesor.nombre}
            rol={turno.profesor.rol}
            cargo={turno.profesor.cargo}
          />
        </div>
      ) : (
        <p className="mt-1 text-sm text-text-subtle">Sin profesor asignado</p>
      )}
    </Link>
  );
}
