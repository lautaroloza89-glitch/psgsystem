import type { TipoTorneo } from "@/types";

/** Mismos íconos que Luciana ya usa al escribir estos eventos a mano. */
export const ICONO_TIPO_TORNEO: Record<TipoTorneo, string> = {
  torneo: "🏆",
  exhibicion: "💫",
  evento: "📆",
};

export const LABEL_TIPO_TORNEO: Record<TipoTorneo, string> = {
  torneo: "Torneo",
  exhibicion: "Exhibición",
  evento: "Evento",
};
