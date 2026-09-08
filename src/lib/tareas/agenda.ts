import { diaIsoDeFecha, nombreDia, nombreMes, sumarDias } from "@/lib/utils/date";
import type { EstadoTarea } from "@/types";

export interface TareaEnLista {
  id: string;
  titulo: string;
  estado: EstadoTarea;
  fecha_vencimiento: string | null;
  /** Nombres de pila de los responsables, en el orden en que vienen. */
  responsables: string[];
  /** Quién la creó — se guarda en `created_by` y hasta ahora no se mostraba nunca. */
  asignadaPor: string | null;
  esMia: boolean;
  /** Lo que necesitan los helpers de permiso para decidir sobre esta tarea. */
  createdBy: string;
  asignadosIds: string[];
}

export type Vista = "abiertas" | "mias" | "hechas" | "todas";

/**
 * Las pestañas dependen del rol, igual que el inicio.
 *
 * Reemplazan al filtro de cuatro estados (Todas / Pendiente / En progreso /
 * Completada), que no tenía la que más falta hacía: **«Mías»**. «En progreso»
 * deja de ser una pestaña propia — se ve marcado dentro de Abiertas.
 *
 * Profesor y Empleado arrancan en «Mías»: para Estefi y Male este módulo es
 * casi todo lo que hacen en la app. Los demás arrancan en el panel completo.
 */
export function pestanasDeVista(esDeGestion: boolean): { vista: Vista; label: string }[] {
  return esDeGestion
    ? [
        { vista: "abiertas", label: "Abiertas" },
        { vista: "mias", label: "Mías" },
        { vista: "hechas", label: "Hechas" },
      ]
    : [
        { vista: "mias", label: "Mías" },
        { vista: "todas", label: "Todas" },
        { vista: "hechas", label: "Hechas" },
      ];
}

export function vistaPorDefecto(esDeGestion: boolean): Vista {
  return esDeGestion ? "abiertas" : "mias";
}

export function vistaValida(valor: string | undefined, esDeGestion: boolean): Vista {
  const permitidas = pestanasDeVista(esDeGestion).map((p) => p.vista);
  return permitidas.includes(valor as Vista) ? (valor as Vista) : vistaPorDefecto(esDeGestion);
}

export const MENSAJE_VACIO: Record<Vista, string> = {
  abiertas: "No hay tareas abiertas.",
  mias: "No tenés tareas asignadas.",
  hechas: "Todavía no hay tareas completadas.",
  todas: "No hay tareas para mostrar.",
};

/**
 * La fecha en palabras. «Vence: 05/09/2026» en gris chiquito no distingue una
 * tarea que venció hace una semana de una que vence en un mes.
 */
export function cuandoVence(fecha: string | null, hoy: string): string {
  if (!fecha) return "Sin fecha";

  if (fecha < hoy) {
    const dias = Math.round(
      (Date.parse(`${hoy}T00:00:00Z`) - Date.parse(`${fecha}T00:00:00Z`)) / 86_400_000
    );
    if (dias === 1) return "Venció ayer";
    return `Venció hace ${dias} días`;
  }

  if (fecha === hoy) return "Hoy";
  if (fecha === sumarDias(hoy, 1)) return "Mañana";
  // Dentro de la semana el día solo alcanza y se lee mejor que la fecha.
  if (fecha <= sumarDias(hoy, 6)) return nombreDia(diaIsoDeFecha(fecha));

  const [, mes, dia] = fecha.split("-").map(Number);
  return `${dia} de ${nombreMes(mes).toLowerCase()}`;
}

export type ClaveGrupo = "vencidas" | "semana" | "adelante" | "sin-fecha";

const TITULOS: Record<ClaveGrupo, string> = {
  vencidas: "Vencidas",
  semana: "Esta semana",
  adelante: "Más adelante",
  "sin-fecha": "Sin fecha",
};

function grupoDeTarea(fecha: string | null, hoy: string): ClaveGrupo {
  if (!fecha) return "sin-fecha";
  if (fecha < hoy) return "vencidas";
  if (fecha <= sumarDias(hoy, 6)) return "semana";
  return "adelante";
}

/**
 * Mismo orden por fecha de siempre, pero agrupado por urgencia, así lo
 * atrasado salta a la vista en vez de quedar arriba sin señal. Las sin fecha
 * van al final.
 */
export function agruparPorUrgencia(
  tareas: TareaEnLista[],
  hoy: string
): { clave: ClaveGrupo; titulo: string; tareas: TareaEnLista[] }[] {
  const orden: ClaveGrupo[] = ["vencidas", "semana", "adelante", "sin-fecha"];

  return orden
    .map((clave) => ({
      clave,
      titulo: TITULOS[clave],
      tareas: tareas.filter((t) => grupoDeTarea(t.fecha_vencimiento, hoy) === clave),
    }))
    .filter((grupo) => grupo.tareas.length > 0);
}

/** «Luciana Godoy» → «Luciana». En la lista el apellido no aporta. */
export function nombreDePila(nombre: string): string {
  return nombre.trim().split(/\s+/)[0] ?? nombre;
}

/** «Luciana y Dai», «Estefi, Male y Caro». */
export function listarNombres(nombres: string[]): string {
  if (nombres.length === 0) return "Sin responsable";
  if (nombres.length === 1) return nombres[0];
  return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}
