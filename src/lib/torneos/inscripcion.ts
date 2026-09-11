import { RECARGO_MONTO } from "@/lib/pagos/reglas";

/**
 * Cuentas de la inscripción a un torneo, compartidas entre la lista de
 * convocadas (cliente) y la planilla (servidor). Viven aparte de
 * `convocatoria.ts` para que el componente de la lista no arrastre las
 * consultas a la base.
 *
 * El recargo es **el mismo de las cuotas**: sale de `RECARGO_MONTO`, no de un
 * segundo número escrito acá.
 */

export { RECARGO_MONTO };

/** Lo que se le cobra a la alumna: el monto más el recargo, si se aplicó. */
export function totalInscripcion(inscripcion: {
  inscripcionMonto: number | null;
  recargoAplicado: boolean | null;
}): number | null {
  if (inscripcion.inscripcionMonto == null) return null;
  return inscripcion.inscripcionMonto + (inscripcion.recargoAplicado ? RECARGO_MONTO : 0);
}
