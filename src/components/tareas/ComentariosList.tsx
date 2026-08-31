import type { Rol } from "@/types";
import { UsuarioRolCargo } from "@/components/ui/UsuarioRolCargo";
import { MarkdownText } from "@/components/ui/MarkdownText";

function formatFechaHora(fecha: string): string {
  return new Date(fecha).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface ComentarioData {
  id: string;
  comentario: string;
  created_at: string;
  autor: { nombre: string; rol: Rol; cargo: string | null } | null;
}

export function ComentariosList({ comentarios }: { comentarios: ComentarioData[] }) {
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
          <MarkdownText texto={comentario.comentario} />
        </li>
      ))}
    </ul>
  );
}
