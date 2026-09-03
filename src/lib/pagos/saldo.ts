import type { createClient } from "@/lib/supabase/server";
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

export interface Deudora {
  alumnaId: string;
  apellido: string;
  nombre: string;
  grupoNombre: string;
  montoEsperado: number;
  montoPagado: number;
  saldo: number;
  diasAtraso: number;
}

/**
 * Alumnas activas (con grupo asignado) que todavía tienen saldo pendiente
 * de un mes dado. Alumnas sin `grupo_id` se excluyen: sin grupo no hay
 * cuota de la que partir para calcular lo esperado.
 */
export async function calcularDeudorasDelMes(
  supabase: SupabaseServerClient,
  mesCorrespondiente: string
): Promise<Deudora[]> {
  const [{ data: alumnas }, { data: pagosVerificados }] = await Promise.all([
    supabase
      .from("alumnas")
      .select("id, apellido, nombre, grupo:grupos(nombre, cuota_mensual)")
      .eq("estado", "activa")
      .not("grupo_id", "is", null),
    supabase
      .from("pagos")
      .select("alumna_id, monto")
      .eq("mes_correspondiente", mesCorrespondiente)
      .eq("estado", "verificado"),
  ]);

  const pagadoPorAlumna = new Map<string, number>();
  for (const p of pagosVerificados ?? []) {
    pagadoPorAlumna.set(p.alumna_id, (pagadoPorAlumna.get(p.alumna_id) ?? 0) + Number(p.monto));
  }

  const recargoAplica = haPasadoDiaLimite(mesCorrespondiente);
  const atraso = diasDeAtraso(mesCorrespondiente);

  const deudoras: Deudora[] = [];
  for (const a of alumnas ?? []) {
    const grupo = a.grupo as unknown as { nombre: string; cuota_mensual: number } | null;
    if (!grupo) continue;

    const montoEsperado = Number(grupo.cuota_mensual) + (recargoAplica ? RECARGO_MONTO : 0);
    const montoPagado = pagadoPorAlumna.get(a.id) ?? 0;
    const saldo = montoEsperado - montoPagado;
    if (saldo <= 0) continue;

    deudoras.push({
      alumnaId: a.id,
      apellido: a.apellido,
      nombre: a.nombre,
      grupoNombre: grupo.nombre,
      montoEsperado,
      montoPagado,
      saldo,
      diasAtraso: atraso,
    });
  }

  deudoras.sort((a, b) => b.saldo - a.saldo);
  return deudoras;
}
