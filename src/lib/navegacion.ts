import type { User } from "@/types";

export type NombreIcono =
  | "house"
  | "calendar"
  | "check-square"
  | "users-three"
  | "money"
  | "trophy"
  | "list-checks"
  | "dots";

export interface Destino {
  href: string;
  label: string;
  icono: NombreIcono;
}

/**
 * Navegación por rol: la barra muestra los **3 destinos que ese rol usa a
 * diario** y manda el resto a «Más». Reemplaza el cajón `☰`, donde los ocho
 * destinos pesaban lo mismo y nada indicaba dónde estabas parado.
 *
 * El criterio no es la jerarquía del rol sino la frecuencia de uso: Secretaria
 * tiene Pagos y Alumnas a mano porque es lo que abre todos los días, y Head
 * Coach tiene Planificaciones y Asistencia por el mismo motivo.
 */

const HOY: Destino = { href: "/dashboard", label: "Hoy", icono: "house" };
const PLANIFICACIONES: Destino = {
  href: "/horarios",
  label: "Planificaciones",
  icono: "calendar",
};
const MIS_CLASES: Destino = { href: "/horarios", label: "Mis clases", icono: "calendar" };
const ASISTENCIA: Destino = {
  href: "/asistencia",
  label: "Asistencia",
  icono: "check-square",
};
const TAREAS: Destino = { href: "/tareas", label: "Tareas", icono: "list-checks" };
const ALUMNAS: Destino = { href: "/alumnas", label: "Alumnas", icono: "users-three" };
const PAGOS: Destino = { href: "/pagos", label: "Pagos", icono: "money" };
const TORNEOS: Destino = { href: "/torneos", label: "Torneos", icono: "trophy" };
const MIEMBROS: Destino = {
  href: "/miembros",
  label: "Miembros del equipo",
  icono: "users-three",
};

/** Los 3 fijos de la barra. El cuarto lugar es siempre «Más». */
export function pestanasDeRol(profile: User): Destino[] {
  switch (profile.rol) {
    case "Admin":
    case "Head Coach":
      return [HOY, PLANIFICACIONES, ASISTENCIA];
    case "Secretaria":
      return [HOY, ALUMNAS, PAGOS];
    case "Profesor":
      return [HOY, MIS_CLASES, TAREAS];
    case "Empleado":
      // `dicta_clases` es independiente del rol: una empleada que además da
      // clases (Male) necesita el mismo acceso rápido que una profesora.
      return profile.dicta_clases ? [HOY, MIS_CLASES, TAREAS] : [HOY, TAREAS, TORNEOS];
    case "Patinador":
      return [{ ...HOY, label: "Inicio" }, TORNEOS];
  }
}

/** Lo que queda fuera de la barra, agrupado como en el cajón viejo. */
export function destinosDelMas(profile: User): { titulo: string | null; destinos: Destino[] }[] {
  const enLaBarra = new Set(pestanasDeRol(profile).map((d) => d.href));
  const fuera = (destinos: Destino[]) => destinos.filter((d) => !enLaBarra.has(d.href));

  if (profile.rol === "Patinador") return [];

  const general = fuera([TORNEOS, TAREAS, PLANIFICACIONES, MIEMBROS]);

  const administracion =
    profile.rol === "Admin" || profile.rol === "Head Coach" || profile.rol === "Secretaria"
      ? fuera([ALUMNAS, PAGOS, ASISTENCIA])
      : [];

  return [
    { titulo: null, destinos: general },
    { titulo: "Administración", destinos: administracion },
  ].filter((grupo) => grupo.destinos.length > 0);
}
