import { nombreDePila } from "@/lib/tareas/agenda";
import type { User } from "@/types";

/**
 * «Quién»: los responsables como chips con el nombre y nada más.
 *
 * Antes era `AsignadosChecklist` (ya borrado), una lista de checkboxes con tres líneas por
 * persona (rol en negrita y cargo debajo) que empujaba «Crear tarea» abajo del
 * scroll. Acá entran las seis en dos renglones.
 *
 * Siguen siendo checkboxes de verdad —ocultos, con el mismo `name`—, así que el
 * `FormData` no cambia y funciona igual sin JavaScript.
 */
export function ChipsResponsables({
  usuarios,
  seleccionados,
  name = "asignados",
}: {
  usuarios: Pick<User, "id" | "nombre" | "rol" | "cargo">[];
  seleccionados?: string[];
  name?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {usuarios.map((usuario) => (
        <label
          key={usuario.id}
          className="cursor-pointer"
          title={usuario.cargo ? `${usuario.nombre} · ${usuario.cargo}` : usuario.nombre}
        >
          <input
            type="checkbox"
            name={name}
            value={usuario.id}
            defaultChecked={seleccionados?.includes(usuario.id)}
            className="peer sr-only"
          />
          <span className="inline-block rounded-full border border-border-strong px-3.5 py-2 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard peer-checked:border-primary-500 peer-checked:bg-primary-500 peer-checked:text-on-primary peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface">
            {nombreDePila(usuario.nombre)}
          </span>
        </label>
      ))}
    </div>
  );
}
