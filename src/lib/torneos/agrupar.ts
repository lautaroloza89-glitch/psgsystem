import { nombreMes } from "@/lib/utils/date";
import { estadoTorneo } from "@/lib/torneos/fechas";

/** Lo mínimo que necesita el agrupado; las pantallas pasan el torneo entero. */
interface ConFechas {
  fecha_inicio: string;
  fecha_fin: string;
}

export interface GrupoDeMes<T> {
  /** `YYYY-MM`, para la key de React. */
  clave: string;
  titulo: string;
  items: T[];
}

/**
 * Agrupa los eventos por mes **conservando el orden en que vienen**, que es lo
 * que permite usar la misma función para Próximos (del más cercano al más
 * lejano) y para Pasados (del más reciente al más viejo).
 *
 * El mes como encabezado reemplaza al badge de estado repetido en cada
 * tarjeta: dentro de una pestaña el estado ya no distingue nada.
 */
export function agruparPorMes<T extends ConFechas>(eventos: T[]): GrupoDeMes<T>[] {
  const grupos: GrupoDeMes<T>[] = [];

  for (const evento of eventos) {
    const clave = evento.fecha_inicio.slice(0, 7);
    const ultimo = grupos[grupos.length - 1];

    if (ultimo?.clave === clave) {
      ultimo.items.push(evento);
    } else {
      grupos.push({ clave, titulo: nombreMes(Number(clave.slice(5, 7))), items: [evento] });
    }
  }

  return grupos;
}

/**
 * Reparte el calendario en las dos pestañas. «En curso» va con los próximos:
 * un torneo que arrancó ayer y termina mañana es lo más presente que hay, no
 * historia.
 *
 * Los pasados salen del más reciente al más viejo — nadie busca el torneo de
 * marzo antes que el del mes pasado —, así que se invierte el orden ascendente
 * con el que vienen de la base.
 */
export function repartirTorneos<T extends ConFechas>(
  torneos: T[],
  hoy: string
): { proximos: T[]; pasados: T[] } {
  const proximos: T[] = [];
  const pasados: T[] = [];

  for (const torneo of torneos) {
    if (estadoTorneo(torneo.fecha_inicio, torneo.fecha_fin, hoy) === "Pasado") {
      pasados.push(torneo);
    } else {
      proximos.push(torneo);
    }
  }

  return { proximos, pasados: pasados.reverse() };
}
