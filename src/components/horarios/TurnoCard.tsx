import Link from "next/link";
import type { EstadoTurno } from "@/types";
import { EstadoTurnoBadge } from "./EstadoTurnoBadge";
import { formatFecha } from "@/lib/utils/date";

export interface TurnoCardData {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  grupo_nivel: string;
  capacidad: number;
  estado: EstadoTurno;
  profesorNombre: string | null;
}

export function TurnoCard({ turno }: { turno: TurnoCardData }) {
  return (
    <Link
      href={`/horarios/${turno.id}`}
      className="block rounded-lg border border-black/10 p-4 hover:border-black/30"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-semibold">{turno.grupo_nivel}</h2>
        <EstadoTurnoBadge estado={turno.estado} />
      </div>
      <p className="mt-2 text-sm text-black/50">
        {formatFecha(turno.fecha)} · {turno.hora_inicio.slice(0, 5)}–{turno.hora_fin.slice(0, 5)}
      </p>
      <p className="mt-1 text-sm text-black/50">
        {turno.profesorNombre ?? "Sin profesor asignado"} · Capacidad {turno.capacidad}
      </p>
    </Link>
  );
}
