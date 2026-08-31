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

/** "Objetivo del mes" por grupo (F2 MOD 1). `mes` siempre es el día 1 del mes. */
export interface GrupoObjetivoMes {
  id: string;
  grupo_id: string;
  mes: string;
  objetivo: string;
  created_at: string;
  updated_at: string;
}
