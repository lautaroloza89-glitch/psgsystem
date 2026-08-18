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
  autor: { nombre: string } | null;
}

export function ComentariosList({ comentarios }: { comentarios: ComentarioData[] }) {
  if (comentarios.length === 0) {
    return <p className="text-sm text-text-subtle">Todavía no hay comentarios.</p>;
  }

  return (
    <ul className="space-y-3">
      {comentarios.map((comentario) => (
        <li key={comentario.id} className="rounded-md border border-border bg-surface-muted p-4 text-sm">
          <div className="flex items-center justify-between text-text-subtle">
            <span className="font-medium text-text-muted">
              {comentario.autor?.nombre ?? "Usuario eliminado"}
            </span>
            <span>{formatFechaHora(comentario.created_at)}</span>
          </div>
          <p className="mt-1 text-base">{comentario.comentario}</p>
        </li>
      ))}
    </ul>
  );
}
