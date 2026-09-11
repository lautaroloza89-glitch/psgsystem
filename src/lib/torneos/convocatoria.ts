import type { createClient } from "@/lib/supabase/server";
import type { EstadoInscripcion } from "@/types";
import { calcularDeudorasDelMes } from "@/lib/pagos/saldo";
import { primerDiaDeMes } from "@/lib/utils/date";
import { formatNumero } from "@/lib/utils/money";
import { RECARGO_MONTO, totalInscripcion } from "./inscripcion";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * La convocatoria de un torneo: quién va y cómo viene la inscripción.
 *
 * **La inscripción no pasa por `pagos`.** Decisión de Lauti al abrir el módulo:
 * lo que una alumna paga para competir es un gasto puntual del torneo que se
 * gira a la organización, no plata que entra al club, así que no puede sumar a
 * la recaudación ni contarse contra la cuota del mes. El estado y el monto
 * viven acá y nada más; `torneo_participantes.pago_id` queda sin usar. Meterlo
 * en `pagos` habría ensuciado el saldo del mes, Deudoras y Recaudación, que
 * están escritos sobre el supuesto de que toda fila de `pagos` es una cuota.
 */

/** Las dos cifras del bloque del detalle, más lo que falta antes de exportar. */
export interface ResumenConvocatoria {
  convocadas: number;
  pagas: number;
  sinPagar: number;
  sinCategoria: number;
  /** Cuántas convocadas no tienen fecha de nacimiento cargada. */
  sinFechaNacimiento: number;
}

export interface Convocada {
  id: string;
  alumnaId: string;
  apellido: string;
  nombre: string;
  dni: string | null;
  fechaNacimiento: string | null;
  categoria: string | null;
  /** `null` para quien no puede ver la plata (Profesor). */
  inscripcionEstado: EstadoInscripcion | null;
  inscripcionMonto: number | null;
  /** Se le cobró el recargo. `null` para quien no puede ver la plata. */
  recargoAplicado: boolean | null;
}

/** Una alumna en el listado desde el que se convoca. */
export interface AlumnaConvocable {
  id: string;
  apellido: string;
  nombre: string;
  grupoId: string | null;
  grupoNombre: string;
  fechaNacimiento: string | null;
  yaConvocada: boolean;
  /**
   * «Debe la cuota de septiembre», si corresponde. **Avisa, no bloquea**: la
   * alumna se puede seleccionar igual —pasa seguido y se la lleva—, la
   * decisión es de la Head Coach.
   */
  deuda: string | null;
}

interface FilaParticipante {
  id: string;
  alumna_id: string;
  categoria: string | null;
  inscripcion_estado: EstadoInscripcion;
  inscripcion_monto: number | null;
  recargo_aplicado: boolean;
  alumna: {
    apellido: string;
    nombre: string;
    dni: string | null;
    fecha_nacimiento: string | null;
  } | null;
}

const SELECT_PARTICIPANTE =
  "id, alumna_id, categoria, inscripcion_estado, inscripcion_monto, recargo_aplicado, alumna:alumnas(apellido, nombre, dni, fecha_nacimiento)";

/** Ordena como la planilla: por apellido y después por nombre. */
function porApellido(a: Convocada, b: Convocada): number {
  return (
    a.apellido.localeCompare(b.apellido, "es") || a.nombre.localeCompare(b.nombre, "es")
  );
}

/**
 * Las convocadas de un torneo.
 *
 * `conPlata` en `false` devuelve `inscripcionEstado` y `inscripcionMonto` en
 * `null`: **la Profesora ve nombres, no plata**. Es un límite que la RLS no
 * puede expresar —es por fila, no por columna—, así que se resuelve acá, mismo
 * criterio que el email del personal en `/miembros`.
 */
export async function convocadasDeTorneo(
  supabase: Supabase,
  torneoId: string,
  conPlata: boolean
): Promise<Convocada[]> {
  const { data } = await supabase
    .from("torneo_participantes")
    .select(SELECT_PARTICIPANTE)
    .eq("torneo_id", torneoId);

  const filas = (data ?? []) as unknown as FilaParticipante[];

  return filas
    .map((fila) => ({
      id: fila.id,
      alumnaId: fila.alumna_id,
      apellido: fila.alumna?.apellido ?? "",
      nombre: fila.alumna?.nombre ?? "",
      dni: fila.alumna?.dni ?? null,
      fechaNacimiento: fila.alumna?.fecha_nacimiento ?? null,
      categoria: fila.categoria,
      inscripcionEstado: conPlata ? fila.inscripcion_estado : null,
      inscripcionMonto:
        conPlata && fila.inscripcion_monto != null ? Number(fila.inscripcion_monto) : null,
      recargoAplicado: conPlata ? fila.recargo_aplicado : null,
    }))
    .sort(porApellido);
}

/**
 * Las cifras del bloque del detalle. Se cuenta sobre las mismas filas que
 * lista la pantalla, así que el número de arriba y la lista no pueden
 * discrepar.
 */
export function resumirConvocatoria(convocadas: Convocada[]): ResumenConvocatoria {
  let pagas = 0;
  let sinPagar = 0;
  let sinCategoria = 0;
  let sinFechaNacimiento = 0;

  for (const c of convocadas) {
    // 'Exenta' no es ni paga ni pendiente: no se le cobra, así que no puede
    // figurar como plata que falta entrar.
    if (c.inscripcionEstado === "Paga") pagas++;
    if (c.inscripcionEstado === "Pendiente") sinPagar++;
    if (!c.categoria?.trim()) sinCategoria++;
    if (!c.fechaNacimiento) sinFechaNacimiento++;
  }

  return {
    convocadas: convocadas.length,
    pagas,
    sinPagar,
    sinCategoria,
    sinFechaNacimiento,
  };
}

/**
 * El listado desde el que se convoca: todas las alumnas **activas**, con el
 * grupo del club como eje —los mismos grupos de Alumnas y Asistencia, sin
 * categorías nuevas que mantener— y marcadas las que ya están en la lista.
 *
 * La deuda se calcula contra el mes en curso y es solo un aviso.
 */
export async function alumnasParaConvocar(
  supabase: Supabase,
  torneoId: string,
  hoy: string
): Promise<AlumnaConvocable[]> {
  const mes = primerDiaDeMes(Number(hoy.slice(0, 4)), Number(hoy.slice(5, 7)));

  const [{ data: alumnas }, { data: participantes }, deudoras] = await Promise.all([
    supabase
      .from("alumnas")
      .select("id, apellido, nombre, fecha_nacimiento, grupo_id, grupo:grupos(nombre)")
      .eq("estado", "activa")
      .order("apellido")
      .order("nombre"),
    supabase.from("torneo_participantes").select("alumna_id").eq("torneo_id", torneoId),
    calcularDeudorasDelMes(supabase, mes),
  ]);

  const convocadas = new Set((participantes ?? []).map((p) => p.alumna_id));
  const deudaPorAlumna = new Map(deudoras.deudoras.map((d) => [d.alumnaId, d]));

  const nombreDelMes = new Date(Date.UTC(Number(hoy.slice(0, 4)), Number(hoy.slice(5, 7)) - 1, 1))
    .toLocaleDateString("es-AR", { month: "long", timeZone: "UTC" });

  return (alumnas ?? []).map((a) => {
    const grupo = a.grupo as unknown as { nombre: string } | null;
    return {
      id: a.id,
      apellido: a.apellido,
      nombre: a.nombre,
      grupoId: a.grupo_id,
      grupoNombre: grupo?.nombre ?? "Sin grupo",
      fechaNacimiento: a.fecha_nacimiento,
      yaConvocada: convocadas.has(a.id),
      deuda: deudaPorAlumna.has(a.id) ? `Debe la cuota de ${nombreDelMes}` : null,
    };
  });
}

/** `20/09/2017` — el formato que espera la planilla de la organización. */
function fechaParaPlanilla(fecha: string | null): string {
  if (!fecha) return "";
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

/** Escapa una celda de CSV: comillas dobles y separadores adentro del texto. */
function celda(valor: string): string {
  return /[",;\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;
}

/**
 * La celda «Monto»: lo que efectivamente pagó. Con recargo va desglosado
 * («60.000 + 10.000») para que se vea de dónde sale la diferencia.
 */
function montoParaPlanilla(c: Convocada): string {
  if (c.inscripcionEstado === "Exenta") return "Exenta";
  if (c.inscripcionEstado !== "Paga") return "Sin pagar";
  if (c.inscripcionMonto == null) return "";
  return c.recargoAplicado
    ? `${formatNumero(c.inscripcionMonto)} + ${formatNumero(RECARGO_MONTO)}`
    : formatNumero(c.inscripcionMonto);
}

/**
 * La planilla que se manda a la organización: nombre, DNI, fecha de nacimiento
 * y categoría, las mismas columnas de siempre.
 *
 * Con `conPlata` se suma la columna **Monto** (lo pagado por cada una, con el
 * recargo a la vista) y el **total al pie**, que suma solo las que pagaron.
 * Sin `conPlata` —la Profesora también puede bajarla— la planilla sale sin
 * plata, igual que la pantalla.
 *
 * Separador `;` y BOM: es lo que hace que Excel en español abra el archivo en
 * columnas de una, sin pasar por el asistente de importación. Las alumnas sin
 * fecha de nacimiento van igual, con la celda vacía — la pantalla avisa
 * cuántas son antes de bajarlo.
 */
export function planillaCsv(convocadas: Convocada[], conPlata: boolean): string {
  const encabezado = ["Apellido y nombre", "DNI", "Fecha de nacimiento", "Categoría"];
  const filas = [
    conPlata ? [...encabezado, "Monto"] : encabezado,
    ...convocadas.map((c) => {
      const fila = [
        `${c.apellido}, ${c.nombre}`,
        c.dni ?? "",
        fechaParaPlanilla(c.fechaNacimiento),
        c.categoria ?? "",
      ];
      return conPlata ? [...fila, montoParaPlanilla(c)] : fila;
    }),
  ];

  if (conPlata) {
    const total = convocadas
      .filter((c) => c.inscripcionEstado === "Paga")
      .reduce((acc, c) => acc + (totalInscripcion(c) ?? 0), 0);
    filas.push(["Total", "", "", "", formatNumero(total)]);
  }

  return `﻿${filas.map((f) => f.map(celda).join(";")).join("\r\n")}\r\n`;
}
