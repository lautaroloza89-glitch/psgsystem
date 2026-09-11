import type { createClient } from "@/lib/supabase/server";
import { compararAlumnas } from "@/lib/utils/texto";
import { RECARGO_MONTO, diasDeAtraso, haPasadoDiaLimite } from "./reglas";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface SaldoAlumnaMes {
  montoCuota: number;
  montoPagadoVerificado: number;
  /** Saldo sin contar un eventual recargo — usado para decidir si sugerirlo. */
  saldoSinRecargo: number;
  sugerirRecargo: boolean;
}

/**
 * Saldo de una alumna puntual para un mes, usado por el formulario de alta
 * (autocompletar `monto_cuota`, sugerir el recargo, mostrar el saldo
 * pendiente antes de guardar). Devuelve `null` si la alumna no tiene grupo
 * asignado (no hay cuota de la que partir).
 */
export async function calcularSaldoAlumnaMes(
  supabase: SupabaseServerClient,
  alumnaId: string,
  mesCorrespondiente: string
): Promise<SaldoAlumnaMes | null> {
  const { data: alumna } = await supabase
    .from("alumnas")
    .select("grupo:grupos(cuota_mensual)")
    .eq("id", alumnaId)
    .single();

  const grupo = alumna?.grupo as unknown as { cuota_mensual: number } | null;
  if (!grupo) return null;

  const { data: pagosVerificados } = await supabase
    .from("pagos")
    .select("monto")
    .eq("alumna_id", alumnaId)
    .eq("mes_correspondiente", mesCorrespondiente)
    .eq("estado", "verificado");

  const montoPagadoVerificado = (pagosVerificados ?? []).reduce(
    (acc, p) => acc + Number(p.monto),
    0
  );
  const montoCuota = Number(grupo.cuota_mensual);
  const saldoSinRecargo = montoCuota - montoPagadoVerificado;

  return {
    montoCuota,
    montoPagadoVerificado,
    saldoSinRecargo,
    sugerirRecargo: haPasadoDiaLimite(mesCorrespondiente) && saldoSinRecargo > 0,
  };
}

/** Por qué debe: lo que reemplaza al «X días de atraso» repetido en cada fila. */
export type MotivoDeuda = "sin_pagar" | "pago_parcial" | "solo_recargo";

export interface ContactoDeudora {
  nombre: string;
  telefono: string;
}

export interface Deudora {
  alumnaId: string;
  apellido: string;
  nombre: string;
  grupoNombre: string;
  cuota: number;
  /** 0 si el mes todavía no pasó el día 10. */
  recargo: number;
  montoEsperado: number;
  montoPagado: number;
  saldo: number;
  motivo: MotivoDeuda;
  /** Se fue del club pero quedó debiendo: se muestra distinto, no se oculta. */
  deBaja: boolean;
  /** Pagador principal si hay uno cargado; si no, el primer contacto. */
  contacto: ContactoDeudora | null;
}

export interface ResumenDeudoras {
  deudoras: Deudora[];
  /** Suma de los saldos. */
  totalAdeudado: number;
  /** Igual para todas: sale del mes, no de la alumna. Va una sola vez, arriba. */
  diasAtraso: number;
  /** Ya pasó el día 10 del mes: los montos traen el recargo adentro. */
  recargoAplicado: boolean;
}

interface FilaAlumna {
  id: string;
  apellido: string;
  nombre: string;
  estado: string;
  fecha_baja: string | null;
  grupo: { nombre: string; cuota_mensual: number } | null;
  contactos: { nombre: string; telefono: string; es_pagador_principal: boolean }[] | null;
}

/** ¿Se le sigue cobrando la cuota de `mesCorrespondiente` a esta alumna? */
function generaCuota(alumna: FilaAlumna, mesCorrespondiente: string): boolean {
  if (alumna.estado === "activa") return true;
  // De baja sin fecha registrada (baja vieja): no se le cobra ningún mes. Es
  // el lado seguro — no inventar deuda a partir de un dato que nadie cargó.
  if (!alumna.fecha_baja) return false;
  // Hasta el mes de su baja inclusive.
  return alumna.fecha_baja >= mesCorrespondiente;
}

function motivoDeDeuda(montoPagado: number, cuota: number): MotivoDeuda {
  if (montoPagado <= 0) return "sin_pagar";
  return montoPagado >= cuota ? "solo_recargo" : "pago_parcial";
}

/**
 * Alumnas con saldo pendiente de un mes, en orden alfabético y con las de
 * baja al final.
 *
 * **La baja no cancela la deuda** (2026-09-08). Antes esto filtraba
 * `estado = 'activa'`, así que dar de baja a una alumna la sacaba del reporte
 * con la deuda intacta: la baja funcionaba como borrado de deuda sin que nadie
 * lo hubiera decidido. Ahora las de baja siguen figurando hasta el mes de su
 * `fecha_baja`, y la única forma de sacar a alguien de la lista es **saldarle
 * el mes con un motivo** (`deudas_saldadas`), que no toca `pagos` y por lo
 * tanto no altera la recaudación.
 *
 * Alumnas sin `grupo_id` se excluyen: sin grupo no hay cuota de la que partir.
 */
export async function calcularDeudorasDelMes(
  supabase: SupabaseServerClient,
  mesCorrespondiente: string
): Promise<ResumenDeudoras> {
  const [{ data: alumnas }, { data: pagosVerificados }, { data: saldadas }] = await Promise.all([
    supabase
      .from("alumnas")
      .select(
        "id, apellido, nombre, estado, fecha_baja, grupo:grupos(nombre, cuota_mensual), contactos(nombre, telefono, es_pagador_principal)"
      )
      .not("grupo_id", "is", null),
    supabase
      .from("pagos")
      .select("alumna_id, monto")
      .eq("mes_correspondiente", mesCorrespondiente)
      .eq("estado", "verificado"),
    supabase
      .from("deudas_saldadas")
      .select("alumna_id")
      .eq("mes_correspondiente", mesCorrespondiente),
  ]);

  const pagadoPorAlumna = new Map<string, number>();
  for (const p of pagosVerificados ?? []) {
    pagadoPorAlumna.set(p.alumna_id, (pagadoPorAlumna.get(p.alumna_id) ?? 0) + Number(p.monto));
  }

  const yaSaldadas = new Set((saldadas ?? []).map((s) => s.alumna_id));

  const recargoAplica = haPasadoDiaLimite(mesCorrespondiente);
  const recargo = recargoAplica ? RECARGO_MONTO : 0;

  const deudoras: Deudora[] = [];
  for (const fila of (alumnas ?? []) as unknown as FilaAlumna[]) {
    const grupo = fila.grupo;
    if (!grupo) continue;
    if (yaSaldadas.has(fila.id)) continue;
    if (!generaCuota(fila, mesCorrespondiente)) continue;

    const cuota = Number(grupo.cuota_mensual);
    const montoEsperado = cuota + recargo;
    const montoPagado = pagadoPorAlumna.get(fila.id) ?? 0;
    const saldo = montoEsperado - montoPagado;
    if (saldo <= 0) continue;

    const contactos = fila.contactos ?? [];
    const contacto = contactos.find((c) => c.es_pagador_principal) ?? contactos[0] ?? null;

    deudoras.push({
      alumnaId: fila.id,
      apellido: fila.apellido,
      nombre: fila.nombre,
      grupoNombre: grupo.nombre,
      cuota,
      recargo,
      montoEsperado,
      montoPagado,
      saldo,
      motivo: motivoDeDeuda(montoPagado, cuota),
      deBaja: fila.estado !== "activa",
      contacto: contacto ? { nombre: contacto.nombre, telefono: contacto.telefono } : null,
    });
  }

  // Alfabético de punta a punta, con las bajas agrupadas al final para que no
  // estorben el cobro diario. Antes era por saldo, de mayor a menor: con
  // recargos y pagos parciales, las «A» quedaban repartidas en dos tramos.
  deudoras.sort((a, b) => Number(a.deBaja) - Number(b.deBaja) || compararAlumnas(a, b));

  return {
    deudoras,
    totalAdeudado: deudoras.reduce((acc, d) => acc + d.saldo, 0),
    diasAtraso: diasDeAtraso(mesCorrespondiente),
    recargoAplicado: recargoAplica,
  };
}
