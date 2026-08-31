import type { User } from "@/types";
import { UsuarioRolCargo } from "@/components/ui/UsuarioRolCargo";

export function AsignadosChecklist({
  usuarios,
  seleccionados,
  name = "asignados",
}: {
  usuarios: Pick<User, "id" | "nombre" | "rol" | "cargo">[];
  seleccionados?: string[];
  /** Nombre del campo en el FormData. Default "asignados" (Tareas); Horarios usa "profesores". */
  name?: string;
}) {
  return (
    <div className="space-y-1 rounded-md border border-border p-3">
      {usuarios.map((usuario) => (
        <label
          key={usuario.id}
          className="flex items-start gap-2 rounded px-2 py-1.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted"
        >
          <input
            type="checkbox"
            name={name}
            value={usuario.id}
            defaultChecked={seleccionados?.includes(usuario.id)}
            className="mt-1 h-4 w-4 shrink-0 rounded accent-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface"
          />
          <UsuarioRolCargo nombre={usuario.nombre} rol={usuario.rol} cargo={usuario.cargo} />
        </label>
      ))}
    </div>
  );
}
