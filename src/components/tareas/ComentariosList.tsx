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
    return <p className="text-sm text-black/50">Todavía no hay comentarios.</p>;
  }

  return (
    <ul className="space-y-3">
      {comentarios.map((comentario) => (
        <li key={comentario.id} className="rounded border border-black/10 p-3 text-sm">
          <div className="flex items-center justify-between text-black/50">
            <span className="font-medium text-black/70">
              {comentario.autor?.nombre ?? "Usuario eliminado"}
            </span>
            <span>{formatFechaHora(comentario.created_at)}</span>
          </div>
          <p className="mt-1">{comentario.comentario}</p>
        </li>
      ))}
    </ul>
  );
}
