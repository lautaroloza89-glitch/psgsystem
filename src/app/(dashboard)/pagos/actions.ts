"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/get-current-user";
import { RECARGO_MONTO } from "@/lib/pagos/reglas";
import { calcularSaldoAlumnaMes, type SaldoAlumnaMes } from "@/lib/pagos/saldo";
import { construirTextoRecibo } from "@/lib/pagos/recibo";
import type { MetodoPago, Rol } from "@/types";

export interface FormState {
  error: string | null;
}

const METODOS_VALIDOS: MetodoPago[] = ["efectivo", "transferencia", "debito"];

function puedeGestionarPagos(rol: Rol | undefined): boolean {
  return rol === "Admin" || rol === "Head Coach" || rol === "Secretaria";
}

interface MetodoInput {
  metodo: MetodoPago;
  monto: number;
}

function leerMetodos(formData: FormData): MetodoInput[] | null {
  const metodos = formData.getAll("metodo") as string[];
  const montos = formData.getAll("metodo_monto") as string[];

  const filas: MetodoInput[] = [];
  for (let i = 0; i < metodos.length; i++) {
    const metodoRaw = metodos[i];
    const montoRaw = montos[i];
    if (!metodoRaw && !montoRaw) continue; // fila sin completar, se ignora

    const monto = Number(montoRaw);
    if (!METODOS_VALIDOS.includes(metodoRaw as MetodoPago) || !Number.isFinite(monto) || monto <= 0) {
      return null;
    }
    filas.push({ metodo: metodoRaw as MetodoPago, monto });
  }
  return filas;
}

export async function crearPago(_prevState: FormState, formData: FormData): Promise<FormState> {
  const profile = await getCurrentUserProfile();
  if (!profile || !puedeGestionarPagos(profile.rol)) {
    return { error: "No tenés permiso para registrar pagos." };
  }

  const alumna_id = ((formData.get("alumna_id") as string) ?? "").trim();
  const mesInput = ((formData.get("mes_correspondiente") as string) ?? "").trim(); // "YYYY-MM"
  const contactoIdRaw = ((formData.get("contacto_id") as string) ?? "").trim();
  const contacto_id = contactoIdRaw.length > 0 ? contactoIdRaw : null;
  const incluirRecargo = formData.get("incluir_recargo") === "on";

  if (!alumna_id) {
    return { error: "Elegí una alumna." };
  }
  if (!/^\d{4}-\d{2}$/.test(mesInput)) {
    return { error: "Elegí el mes correspondiente." };
  }
  const mes_correspondiente = `${mesInput}-01`;

  const metodos = leerMetodos(formData);
  if (!metodos || metodos.length === 0) {
    return { error: "Cargá al menos un método de pago con un monto válido." };
  }

  const monto = metodos.reduce((acc, m) => acc + m.monto, 0);

  const supabase = await createClient();

  const { data: alumna } = await supabase
    .from("alumnas")
    .select("grupo:grupos(cuota_mensual)")
    .eq("id", alumna_id)
    .single();

  const grupo = alumna?.grupo as unknown as { cuota_mensual: number } | null;
  if (!grupo) {
    return { error: "Esta alumna no tiene un grupo asignado — no se puede registrar un pago." };
  }

  const { data: nuevoPago, error } = await supabase
    .from("pagos")
    .insert({
      alumna_id,
      contacto_id,
      mes_correspondiente,
      monto_cuota: grupo.cuota_mensual,
      monto_recargo: incluirRecargo ? RECARGO_MONTO : 0,
      monto,
      registrado_por: profile.id,
    })
    .select("id")
    .single();

  if (error || !nuevoPago) {
    return { error: "No se pudo registrar el pago." };
  }

  const { error: metodosError } = await supabase.from("pagos_metodos").insert(
    metodos.map((m) => ({ pago_id: nuevoPago.id, metodo: m.metodo, monto: m.monto }))
  );

  if (metodosError) {
    return { error: "El pago se registró, pero no se pudieron guardar los métodos." };
  }

  revalidatePath("/pagos/pendientes");
  revalidatePath("/pagos/recaudacion");
  revalidatePath("/pagos/deudoras");
  redirect(`/pagos/pendientes?mes=${mesInput}`);
}

interface ResultadoVerificacion {
  error: string | null;
  reciboTexto?: string;
}

export async function marcarPagoVerificado(pagoId: string): Promise<ResultadoVerificacion> {
  const profile = await getCurrentUserProfile();
  if (!profile || !puedeGestionarPagos(profile.rol)) {
    return { error: "No tenés permiso para verificar pagos." };
  }

  const supabase = await createClient();

  const { data: pago } = await supabase
    .from("pagos")
    .select(
      "id, alumna_id, mes_correspondiente, monto, monto_cuota, monto_recargo, estado, alumna:alumnas(nombre, apellido), metodos:pagos_metodos(metodo, monto)"
    )
    .eq("id", pagoId)
    .single();

  if (!pago) {
    return { error: "No se encontró el pago." };
  }
  if (pago.estado !== "pendiente_verificar") {
    return { error: "Este pago ya fue verificado." };
  }

  const { error } = await supabase
    .from("pagos")
    .update({
      estado: "verificado",
      verificado_por: profile.id,
      verificado_en: new Date().toISOString(),
    })
    .eq("id", pagoId);

  if (error) {
    return { error: "No se pudo marcar el pago como verificado." };
  }

  const { data: verificadosDelMes } = await supabase
    .from("pagos")
    .select("monto")
    .eq("alumna_id", pago.alumna_id)
    .eq("mes_correspondiente", pago.mes_correspondiente)
    .eq("estado", "verificado");

  const totalVerificado = (verificadosDelMes ?? []).reduce((acc, p) => acc + Number(p.monto), 0);
  const montoEsperado = Number(pago.monto_cuota) + Number(pago.monto_recargo);
  const saldoPendiente = Math.max(0, montoEsperado - totalVerificado);

  const alumna = pago.alumna as unknown as { nombre: string; apellido: string } | null;

  const reciboTexto = construirTextoRecibo({
    alumnaNombre: alumna ? `${alumna.nombre} ${alumna.apellido}` : "la alumna",
    mesCorrespondiente: pago.mes_correspondiente,
    monto: Number(pago.monto),
    metodos: (pago.metodos ?? []).map((m) => ({
      metodo: m.metodo as MetodoPago,
      monto: Number(m.monto),
    })),
    saldoPendiente,
  });

  revalidatePath("/pagos/pendientes");
  revalidatePath("/pagos/recaudacion");
  revalidatePath("/pagos/deudoras");

  return { error: null, reciboTexto };
}

interface ResultadoSaldo {
  error: string | null;
  saldo?: SaldoAlumnaMes;
}

/** Callable directo desde el cliente (no atado a un `<form>`) para la sugerencia en vivo del formulario de alta. */
export async function obtenerSaldoAlumnaMes(alumnaId: string, mesInput: string): Promise<ResultadoSaldo> {
  const profile = await getCurrentUserProfile();
  if (!profile || !puedeGestionarPagos(profile.rol)) {
    return { error: "No tenés permiso." };
  }
  if (!/^\d{4}-\d{2}$/.test(mesInput)) {
    return { error: "Mes inválido." };
  }

  const supabase = await createClient();
  const saldo = await calcularSaldoAlumnaMes(supabase, alumnaId, `${mesInput}-01`);
  if (!saldo) {
    return { error: "Esta alumna no tiene un grupo asignado." };
  }
  return { error: null, saldo };
}
