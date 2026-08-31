import type { Rol } from "@/types";
import { UsuarioRolCargo } from "@/components/ui/UsuarioRolCargo";
import { ComentarioMarkdown } from "@/components/ui/ComentarioMarkdown";
import { formatFechaHora } from "@/lib/utils/date";

export interface ComentarioTurnoData {
  id: string;
  comentario: string;
  created_at: string;
  autor: { nombre: string; rol: Rol; cargo: string | null } | null;
}

export function ComentariosTurnoList({ comentarios }: { comentarios: ComentarioTurnoData[] }) {
  if (comentarios.length === 0) {
    return <p className="text-sm text-text-subtle">Todavía no hay comentarios.</p>;
  }

  return (
    <ul className="space-y-3">
      {comentarios.map((comentario) => (
        <li key={comentario.id} className="rounded-md border border-border bg-surface-muted p-4 text-sm">
          <div className="flex items-start justify-between gap-2 text-text-subtle">
            {comentario.autor ? (
              <UsuarioRolCargo
                nombre={comentario.autor.nombre}
                rol={comentario.autor.rol}
                cargo={comentario.autor.cargo}
              />
            ) : (
              <span className="font-medium text-text-muted">Usuario eliminado</span>
            )}
            <span>{formatFechaHora(comentario.created_at)}</span>
          </div>
          <ComentarioMarkdown texto={comentario.comentario} />
        </li>
      ))}
    </ul>
  );
}
