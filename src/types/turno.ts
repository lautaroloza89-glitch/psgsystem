export type EstadoTurno = "Activo" | "Cancelado";

export interface Turno {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  grupo_nivel: string;
  capacidad: number | null;
  profesor_id: string | null;
  estado: EstadoTurno;
  created_at: string;
  updated_at: string;
}

export interface TurnoComentario {
  id: string;
  turno_id: string;
  autor_id: string | null;
  comentario: string;
  created_at: string;
}
