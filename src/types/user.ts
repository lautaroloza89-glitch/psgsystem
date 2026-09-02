// "Secretaria" todavía no es un valor posible de users.rol en la base (Dai
// sigue en "Admin" como parche temporal, ver PROGRESS.md); se agrega igual al
// tipo para que el código de permisos ya compile contra el rol real, mismo
// criterio que las policies de RLS de alumnas/contactos (Fase 2, Sesión 1).
export type Rol = "Admin" | "Profesor" | "Empleado" | "Head Coach" | "Patinador" | "Secretaria";

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  dicta_clases: boolean;
  cargo: string | null;
  created_at: string;
}
