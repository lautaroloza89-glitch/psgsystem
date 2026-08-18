export type Rol = "Admin" | "Profesor" | "Empleado";

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  dicta_clases: boolean;
  created_at: string;
}
