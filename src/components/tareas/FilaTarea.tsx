import Link from "next/link";
import { AccionesRapidas } from "@/components/tareas/AccionesRapidas";
import { cuandoVence, listarNombres, type TareaEnLista } from "@/lib/tareas/agenda";

/**
 * Una tarea en el listado. Reemplaza a `TareaCard`, que era una tarjeta con
 * badge de estado y tres líneas por responsable (rol en negrita, cargo debajo):
 * tres tareas por pantalla.
 *
 * Acá queda el título, cuándo vence en palabras y el nombre del responsable.
 * El badge sobrevive solo para «En progreso», el único estado que agrega algo:
 * «Pendiente» ya lo dice el grupo de fecha y «Completada», la pestaña.
 */
export function FilaTarea({
  tarea,
  hoy,
  vencida,
  conAcciones,
}: {
  tarea: TareaEnLista;
  hoy: string;
  vencida: boolean;
  /** «Ya está» / «Empecé»: solo en las propias y para quien puede cerrarlas. */
  conAcciones: boolean;
}) {
  const quien = tarea.esMia
    ? tarea.asignadaPor
      ? `te la asignó ${tarea.asignadaPor}`
      : listarNombres(tarea.responsables)
    : listarNombres(tarea.responsables);

  return (
    <>
      <Link
        href={`/tareas/${tarea.id}`}
        className="flex items-center gap-3 px-4 py-3 transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-semibold leading-snug">{tarea.titulo}</span>
          <span className="block truncate text-sm text-text-subtle">
            <span className={vencida ? "font-medium text-error-600" : ""}>
              {cuandoVence(tarea.fecha_vencimiento, hoy)}
            </span>
            {" · "}
            {quien}
          </span>
        </span>

        {tarea.estado === "En progreso" && (
          <span className="flex-none rounded-full bg-info-50 px-2 py-0.5 text-xs font-medium text-info-700">
            En progreso
          </span>
        )}

        <span aria-hidden="true" className="flex-none text-text-subtle">
          ›
        </span>
      </Link>

      {conAcciones && tarea.estado !== "Completada" && (
        <AccionesRapidas tareaId={tarea.id} estado={tarea.estado} />
      )}
    </>
  );
}
