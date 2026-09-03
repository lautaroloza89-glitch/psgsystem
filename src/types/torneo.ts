export type TipoTorneo = "torneo" | "exhibicion" | "evento";

export interface Torneo {
  id: string;
  nombre: string;
  tipo: TipoTorneo;
  lugar: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  notas: string | null;
  created_at: string;
  updated_at: string;
}
