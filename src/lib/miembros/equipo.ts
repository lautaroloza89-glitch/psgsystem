import type { Rol, User } from "@/types";

export interface MiembroLista {
  id: string;
  nombre: string;
  rol: Rol;
  cargo: string | null;
  dicta_clases: boolean;
}

/**
 * El listado se agrupa por rol, y el rol pasa a ser **encabezado del grupo**
 * en vez de repetirse en cada fila: se dice una vez por grupo en lugar de una
 * vez por persona. Es lo que deja entrar al equipo entero en una pantalla.
 *
 * «Dirección» junta Admin, Head Coach y Secretaria: son tres roles distintos
 * en permisos, pero para «quién es quién» son el mismo grupo.
 */
const GRUPOS: { titulo: string; roles: Rol[] }[] = [
  { titulo: "Dirección", roles: ["Admin", "Head Coach", "Secretaria"] },
  { titulo: "Profesoras", roles: ["Profesor"] },
  { titulo: "Empleadas", roles: ["Empleado"] },
  { titulo: "Alumnas con acceso", roles: ["Patinador"] },
];

export function agruparPorRol(
  miembros: MiembroLista[]
): { titulo: string; miembros: MiembroLista[] }[] {
  return GRUPOS.map((grupo) => ({
    titulo: grupo.titulo,
    // El orden alfabético se mantiene (viene de la consulta), pero dentro de
    // cada grupo. En «Dirección» manda el orden de los roles, no el nombre.
    miembros: grupo.roles.flatMap((rol) => miembros.filter((m) => m.rol === rol)),
  })).filter((grupo) => grupo.miembros.length > 0);
}

/** «Luciana Godoy» → «LG». Con un solo nombre, la primera letra alcanza. */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0][0].toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/** Femenino donde el club lo usa así; `Rol` en la base es masculino singular. */
const ROL_EN_FICHA: Record<Rol, string> = {
  Admin: "Admin",
  "Head Coach": "Head Coach",
  Secretaria: "Secretaria",
  Profesor: "Profesora",
  Empleado: "Empleada",
  Patinador: "Alumna",
};

export function nombreDeRol(rol: Rol): string {
  return ROL_EN_FICHA[rol];
}

/**
 * La segunda línea de cada fila: el cargo si lo hay, y si no «da clases»
 * —el `dicta_clases` que hasta ahora se guardaba sin mostrarse en ningún
 * lado, y que es lo que explica que Male dicte siendo Empleada—.
 */
export function subtituloMiembro(miembro: MiembroLista): string {
  const partes = [nombreDeRol(miembro.rol)];
  if (miembro.cargo) partes.push(miembro.cargo);
  else if (miembro.dicta_clases) partes.push("da clases");
  return partes.join(" · ");
}

/** «En el club desde marzo de 2024», a partir de `users.created_at`. */
export function enElClubDesde(createdAt: string): string {
  const fecha = new Date(createdAt);
  const mes = fecha.toLocaleDateString("es-AR", {
    month: "long",
    timeZone: "America/Argentina/Buenos_Aires",
  });
  const anio = fecha.toLocaleDateString("es-AR", {
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });
  return `En el club desde ${mes} de ${anio}`;
}

export type PerfilDeUsuario = Pick<
  User,
  "id" | "nombre" | "rol" | "cargo" | "dicta_clases" | "email" | "created_at"
>;
