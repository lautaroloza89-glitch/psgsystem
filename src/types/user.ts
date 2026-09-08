/** Baja lógica del personal: quien se va deja de figurar sin perder sus tareas ni sus turnos. */
export type EstadoUsuario = "activo" | "baja";

export type Rol = "Admin" | "Profesor" | "Empleado" | "Head Coach" | "Patinador" | "Secretaria";

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  dicta_clases: boolean;
  cargo: string | null;
  estado: EstadoUsuario;
  created_at: string;
}
