export interface Grupo {
  id: string;
  nombre: string;
  cuota_mensual: number;
  created_at: string;
  updated_at: string;
}

// dias: día ISO (extract(isodow from fecha)) — 1=lunes ... 7=domingo.
export interface GrupoHorario {
  id: string;
  grupo_id: string;
  dias: number[];
  hora_inicio: string;
  hora_fin: string;
  created_at: string;
}
