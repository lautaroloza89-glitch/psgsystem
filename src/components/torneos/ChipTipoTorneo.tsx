import type { TipoTorneo } from "@/types";
import { LABEL_TIPO_TORNEO } from "@/lib/torneos/tipo";

/**
 * El tipo del evento, como chip de texto.
 *
 * Antes era un emoji suelto delante del nombre y la palabra solo aparecía en
 * el detalle. Se lee mejor escrito, y no depende de que el emoji cargue en el
 * celular de cada una. Los emojis siguen en `ICONO_TIPO_TORNEO` — decisión de
 * Lauti al cerrar el módulo: en el chip va solo la palabra.
 */
export function ChipTipoTorneo({
  tipo,
  tono = "claro",
}: {
  tipo: TipoTorneo;
  /** «oscuro» para el destacado, que va sobre fondo primario. */
  tono?: "claro" | "oscuro";
}) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-sm font-medium ${
        tono === "oscuro"
          ? "bg-primary-100 text-primary-800"
          : "bg-surface-muted text-text-muted"
      }`}
    >
      {LABEL_TIPO_TORNEO[tipo]}
    </span>
  );
}
