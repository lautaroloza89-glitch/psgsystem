export type EstadoPago = "pendiente_verificar" | "verificado";
export type MetodoPago = "efectivo" | "transferencia" | "debito";

export interface Pago {
  id: string;
  alumna_id: string;
  contacto_id: string | null;
  mes_correspondiente: string;
  monto_cuota: number;
  monto_recargo: number;
  monto: number;
  estado: EstadoPago;
  registrado_por: string;
  verificado_por: string | null;
  verificado_en: string | null;
  created_at: string;
}

export interface PagoMetodo {
  id: string;
  pago_id: string;
  metodo: MetodoPago;
  monto: number;
}
