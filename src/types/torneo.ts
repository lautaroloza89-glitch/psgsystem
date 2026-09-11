export type TipoTorneo = "torneo" | "exhibicion" | "evento";

export interface Torneo {
  id: string;
  nombre: string;
  tipo: TipoTorneo;
  lugar: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  notas: string | null;
  /** Valor de la inscripción por alumna de este torneo. Null: evento sin inscripción. */
  inscripcion_monto: number | null;
  created_at: string;
  updated_at: string;
}

/** A veces no se cobra la inscripción: de ahí 'Exenta'. */
export type EstadoInscripcion = "Pendiente" | "Paga" | "Exenta";

export interface TorneoParticipante {
  id: string;
  torneo_id: string;
  alumna_id: string;
  /**
   * Texto libre, sin enum ni validación: las categorías federativas son
   * demasiadas y varían por torneo y federación ("C5 9", "FM 11", "PFM 12").
   * Vive en la convocatoria de este torneo, no en la ficha de la alumna.
   */
  categoria: string | null;
  inscripcion_estado: EstadoInscripcion;
  inscripcion_monto: number | null;
  /** Se le cobró el recargo: suma `RECARGO_MONTO` (el mismo de Pagos) al monto. */
  recargo_aplicado: boolean;
  pago_id: string | null;
  convocada_por: string;
  creado_en: string;
}
