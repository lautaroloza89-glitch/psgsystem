import type { User } from "@/types";

export function AsignadosChecklist({
  usuarios,
  seleccionados,
}: {
  usuarios: Pick<User, "id" | "nombre" | "rol">[];
  seleccionados?: string[];
}) {
  return (
    <div className="space-y-1 rounded border border-black/10 p-2">
      {usuarios.map((usuario) => (
        <label
          key={usuario.id}
          className="flex items-center gap-2 rounded px-1 py-1 text-sm hover:bg-black/5"
        >
          <input
            type="checkbox"
            name="asignados"
            value={usuario.id}
            defaultChecked={seleccionados?.includes(usuario.id)}
            className="h-4 w-4"
          />
          <span>{usuario.nombre}</span>
          <span className="text-black/40">{usuario.rol}</span>
        </label>
      ))}
    </div>
  );
}
