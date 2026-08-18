export type EstadoTarea = "Pendiente" | "En progreso" | "Completada";

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: EstadoTarea;
  fecha_inicio: string | null;
  fecha_vencimiento: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TareaAsignado {
  tarea_id: string;
  usuario_id: string;
  asignado_en: string;
}

export interface TareaComentario {
  id: string;
  tarea_id: string;
  autor_id: string | null;
  comentario: string;
  created_at: string;
}
