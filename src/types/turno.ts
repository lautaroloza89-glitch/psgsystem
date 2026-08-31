export type EstadoTurno = "Activo" | "Cancelado";

export interface Turno {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  /** Texto libre viejo, previo a la FK a `grupos` (Fase 1.2, Sesión 2). Se conserva sin borrar hasta que se remapeen a mano las filas cargadas antes de esa sesión. */
  grupo_legacy: string | null;
  grupo_id: string | null;
  capacidad: number | null;
  estado: EstadoTurno;
  created_at: string;
  updated_at: string;
}

/** Fila de la tabla puente turno_profesores (relación M:N, Groundwork 3). */
export interface TurnoProfesor {
  turno_id: string;
  profesor_id: string;
}

export interface TurnoComentario {
  id: string;
  turno_id: string;
  autor_id: string | null;
  comentario: string;
  created_at: string;
}
