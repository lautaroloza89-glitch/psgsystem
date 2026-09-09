import type { createClient } from "@/lib/supabase/server";
import { calcularDeudorasDelMes, type ResumenDeudoras } from "@/lib/pagos/saldo";
import { hoyArgentina } from "@/lib/utils/date";
import type { MetodoPago } from "@/types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Cómo viene el mes, para la entrada del módulo.
 *
 * `/pagos` eran cuatro tarjetas que solo describían a dónde llevaban: para
 * saber si había pagos esperando verificación o cuántas debían, había que
 * entrar y salir de las cuatro. Todo esto es lo que ahora se ve de una.
 */

export interface RecaudacionDelMes {
  total: number;
  /** Solo los métodos con los que efectivamente entró plata. */
  porMetodo: { metodo: MetodoPago; monto: number }[];
}

export interface PendientesDelMes {
  cantidad: number;
  total: number;
  /** Días que lleva esperando el más viejo; 0 si el más viejo es de hoy. */
  diasDelMasViejo: number;
}

export interface EstadoDelMes {
  recaudacion: RecaudacionDelMes;
  pendientes: PendientesDelMes;
  deudoras: ResumenDeudoras;
  /** Alumnas con cuota de este mes que no deben nada. */
  alDia: number;
  /** Total de alumnas que generan cuota este mes (al día + deudoras). */
  conCuota: number;
  /** Activas sin grupo: no entran en ningún cálculo, y conviene decirlo. */
  activasSinGrupo: number;
}

function diasEntre(desdeISO: string, hasta: string): number {
  const desde = desdeISO.slice(0, 10);
  const ms = Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`);
  return Math.max(0, Math.round(ms / 86_400_000));
}

export async function calcularEstadoDelMes(
  supabase: Supabase,
  mesCorrespondiente: string
): Promise<EstadoDelMes> {
  const hoy = hoyArgentina();

  const [
    { data: verificados },
    { data: pendientes },
    deudoras,
    { count: activasSinGrupo },
    { count: totalConGrupo },
  ] = await Promise.all([
    // El desglose sale de `pagos_metodos`, no de `pagos.monto`: un pago puede
    // venir partido en efectivo + transferencia.
    supabase
      .from("pagos")
      .select("monto, metodos:pagos_metodos(metodo, monto)")
      .eq("mes_correspondiente", mesCorrespondiente)
      .eq("estado", "verificado"),
    supabase
      .from("pagos")
      .select("monto, created_at")
      .eq("mes_correspondiente", mesCorrespondiente)
      .eq("estado", "pendiente_verificar")
      .order("created_at", { ascending: true }),
    calcularDeudorasDelMes(supabase, mesCorrespondiente),
    supabase
      .from("alumnas")
      .select("id", { count: "exact", head: true })
      .eq("estado", "activa")
      .is("grupo_id", null),
    supabase
      .from("alumnas")
      .select("id", { count: "exact", head: true })
      .eq("estado", "activa")
      .not("grupo_id", "is", null),
  ]);

  const porMetodo = new Map<MetodoPago, number>();
  let total = 0;
  for (const pago of verificados ?? []) {
    total += Number(pago.monto);
    const metodos = (pago.metodos ?? []) as unknown as { metodo: MetodoPago; monto: number }[];
    for (const m of metodos) {
      porMetodo.set(m.metodo, (porMetodo.get(m.metodo) ?? 0) + Number(m.monto));
    }
  }

  const filasPendientes = pendientes ?? [];
  const masViejo = filasPendientes[0];

  // Las de baja que siguen debiendo entran en `deudoras` pero no en el conteo
  // de activas, así que «al día» se mide contra las activas con grupo.
  const conCuota = totalConGrupo ?? 0;
  const deudorasActivas = deudoras.deudoras.filter((d) => !d.deBaja).length;

  return {
    recaudacion: {
      total,
      porMetodo: [...porMetodo]
        .map(([metodo, monto]) => ({ metodo, monto }))
        .sort((a, b) => b.monto - a.monto),
    },
    pendientes: {
      cantidad: filasPendientes.length,
      total: filasPendientes.reduce((acc, p) => acc + Number(p.monto), 0),
      diasDelMasViejo: masViejo ? diasEntre(masViejo.created_at, hoy) : 0,
    },
    deudoras,
    alDia: Math.max(0, conCuota - deudorasActivas),
    conCuota,
    activasSinGrupo: activasSinGrupo ?? 0,
  };
}
