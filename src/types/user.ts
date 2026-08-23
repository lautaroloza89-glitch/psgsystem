export type Rol = "Admin" | "Profesor" | "Empleado" | "Head Coach" | "Patinador";

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  dicta_clases: boolean;
  cargo: string | null;
  created_at: string;
}
