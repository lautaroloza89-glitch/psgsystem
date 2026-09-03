/**
 * Asistencia de una alumna a una fecha de clase (F2 MOD 4).
 *
 * `grupo_id` es un snapshot del grupo en el que estaba la alumna ese día: no
 * se deriva de `alumnas.grupo_id` al leer, para que un cambio de grupo no
 * reescriba el historial viejo.
 */
export interface Asistencia {
  id: string;
  alumna_id: string;
  grupo_id: string;
  fecha: string;
  presente: boolean;
  registrado_por: string;
  created_at: string;
}
