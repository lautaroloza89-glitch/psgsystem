import { nombreMes } from "@/lib/utils/date";
import { formatMonto } from "@/lib/utils/money";
import type { MetodoPago } from "@/types";

const LABELS_METODO: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  debito: "Débito",
};

export interface DatosRecibo {
  alumnaNombre: string;
  /** `YYYY-MM-...` */
  mesCorrespondiente: string;
  monto: number;
  metodos: { metodo: MetodoPago; monto: number }[];
  /** 0 (o menos) si el mes queda saldado con este pago. */
  saldoPendiente: number;
}

/** Texto plano para copiar y mandar por WhatsApp — se genera recién después de verificar el pago. */
export function construirTextoRecibo(d: DatosRecibo): string {
  const [anio, mesNum] = d.mesCorrespondiente.slice(0, 7).split("-");
  const mesTexto = `${nombreMes(Number(mesNum)).toLowerCase()} de ${anio}`;
  const metodosTexto = d.metodos
    .map((m) => `${LABELS_METODO[m.metodo] ?? m.metodo} ${formatMonto(m.monto)}`)
    .join(", ");

  const lineas = [
    `Hola! Confirmamos tu pago de ${formatMonto(d.monto)} correspondiente a ${mesTexto} de ${d.alumnaNombre}.`,
    `Medio: ${metodosTexto}.`,
  ];

  if (d.saldoPendiente > 0) {
    lineas.push(`Saldo pendiente del mes: ${formatMonto(d.saldoPendiente)}.`);
  }

  lineas.push("Gracias!");
  return lineas.join("\n");
}
