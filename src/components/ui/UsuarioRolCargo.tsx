import { iniciales, nombreDeRol } from "@/lib/miembros/equipo";
import type { Rol } from "@/types";

/**
 * Una persona: el nombre primero, el rol como subtítulo.
 *
 * **Estaba al revés**: el nombre iba en texto normal y el *rol* en negrita
 * encima, con el cargo en una tercera línea. En una tarjeta con dos
 * responsables eran seis líneas donde «Head Coach» pesaba más que «Luciana».
 * Como el componente se usa en tres módulos (Tareas, Horarios y los dos
 * listados de comentarios), darlo vuelta acá los arregla todos.
 */
export function UsuarioRolCargo({
  nombre,
  rol,
  cargo,
  /** La inicial en círculo se usa donde la persona es el elemento principal. */
  conAvatar = false,
}: {
  /** Omitir si el caller ya renderiza el nombre por su cuenta (ej. un <h2> propio). */
  nombre?: string;
  rol: Rol;
  cargo?: string | null;
  conAvatar?: boolean;
}) {
  const subtitulo = cargo ? `${nombreDeRol(rol)} · ${cargo}` : nombreDeRol(rol);

  const texto = (
    <div className="min-w-0">
      {nombre && <p className="truncate text-sm font-semibold">{nombre}</p>}
      <p className="truncate text-sm text-text-subtle">{subtitulo}</p>
    </div>
  );

  if (!conAvatar || !nombre) return texto;

  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-600"
      >
        {iniciales(nombre)}
      </span>
      {texto}
    </div>
  );
}
