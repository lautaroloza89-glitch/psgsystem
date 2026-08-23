import type { Rol } from "@/types";

export function UsuarioRolCargo({
  nombre,
  rol,
  cargo,
}: {
  /** Omitir si el caller ya renderiza el nombre por su cuenta (ej. un <h2> propio). */
  nombre?: string;
  rol: Rol;
  cargo?: string | null;
}) {
  return (
    <div>
      {nombre && <p className="text-sm">{nombre}</p>}
      <p className="text-sm font-semibold">{rol}</p>
      {cargo && <p className="text-sm text-text-subtle">{cargo}</p>}
    </div>
  );
}
