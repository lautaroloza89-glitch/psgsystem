export type EstadoAlumna = "activa" | "baja";

export interface Alumna {
  id: string;
  apellido: string;
  nombre: string;
  dni: string;
  fecha_inscripcion: string;
  estado: EstadoAlumna;
  grupo_id: string;
  created_at: string;
  updated_at: string;
}

export interface Contacto {
  id: string;
  alumna_id: string;
  nombre: string;
  telefono: string;
  relacion: string;
  es_pagador_principal: boolean;
  created_at: string;
  updated_at: string;
}
