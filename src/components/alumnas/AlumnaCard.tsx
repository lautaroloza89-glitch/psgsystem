import Link from "next/link";
import type { EstadoAlumna } from "@/types";
import { EstadoAlumnaBadge } from "./EstadoAlumnaBadge";
import { formatFecha } from "@/lib/utils/date";

export interface AlumnaCardData {
  id: string;
  apellido: string;
  nombre: string;
  dni: string | null;
  fecha_inscripcion: string;
  estado: EstadoAlumna;
  grupoId: string | null;
  grupoNombre: string;
}

export function AlumnaCard({ alumna }: { alumna: AlumnaCardData }) {
  return (
    <Link
      href={`/alumnas/${alumna.id}`}
      className="block rounded-lg border border-border bg-surface p-5 shadow-xs transition duration-[var(--duration-base)] ease-standard hover:border-border-strong hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {alumna.apellido}, {alumna.nombre}
        </h2>
        <EstadoAlumnaBadge estado={alumna.estado} />
      </div>
      <p className="mt-2 text-sm text-text-subtle">{alumna.grupoNombre}</p>
      <p className="mt-1 hidden text-sm text-text-subtle sm:block">
        {alumna.dni ? `DNI ${alumna.dni}` : "Sin DNI"} · Inscripta el{" "}
        {formatFecha(alumna.fecha_inscripcion)}
      </p>
    </Link>
  );
}
