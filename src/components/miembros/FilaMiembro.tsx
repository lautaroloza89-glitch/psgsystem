import Link from "next/link";
import { iniciales, subtituloMiembro, type MiembroLista } from "@/lib/miembros/equipo";

/**
 * Una persona en el listado del equipo.
 *
 * Reemplaza a `MiembroCard`, que era una tarjeta con el **email** como dato
 * principal —aunque nadie manda mails desde acá— y el rol repetido en cada
 * una. Acá el nombre manda, el rol vive en el encabezado del grupo y el email
 * bajó a la ficha.
 *
 * Sin `href` la fila no es un enlace: Profesor y Empleado ven la lista pero no
 * entran a la ficha de nadie.
 */
export function FilaMiembro({
  miembro,
  esVos,
  href,
}: {
  miembro: MiembroLista;
  esVos: boolean;
  href: string | null;
}) {
  const contenido = (
    <>
      <span
        aria-hidden="true"
        className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-600"
      >
        {iniciales(miembro.nombre)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold leading-snug">
          {miembro.nombre}
          {esVos && <span className="font-normal text-text-subtle"> · vos</span>}
        </span>
        <span className="block truncate text-sm text-text-subtle">
          {subtituloMiembro(miembro)}
        </span>
      </span>
      {href && (
        <span aria-hidden="true" className="flex-none text-text-subtle">
          ›
        </span>
      )}
    </>
  );

  if (!href) {
    return <div className="flex items-center gap-3 px-4 py-3">{contenido}</div>;
  }

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
    >
      {contenido}
    </Link>
  );
}
