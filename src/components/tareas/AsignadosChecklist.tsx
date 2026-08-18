import type { User } from "@/types";

export function AsignadosChecklist({
  usuarios,
  seleccionados,
}: {
  usuarios: Pick<User, "id" | "nombre" | "rol">[];
  seleccionados?: string[];
}) {
  return (
    <div className="space-y-1 rounded-md border border-border p-3">
      {usuarios.map((usuario) => (
        <label
          key={usuario.id}
          className="flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted"
        >
          <input
            type="checkbox"
            name="asignados"
            value={usuario.id}
            defaultChecked={seleccionados?.includes(usuario.id)}
            className="h-4 w-4 rounded accent-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface"
          />
          <span>{usuario.nombre}</span>
          <span className="text-text-subtle">{usuario.rol}</span>
        </label>
      ))}
    </div>
  );
}
