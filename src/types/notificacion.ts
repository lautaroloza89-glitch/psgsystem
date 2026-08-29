export interface Notificacion {
  id: string;
  usuario_id: string;
  tipo: string;
  mensaje: string;
  tarea_id: string | null;
  turno_id: string | null;
  leida: boolean;
  creado_en: string;
}
