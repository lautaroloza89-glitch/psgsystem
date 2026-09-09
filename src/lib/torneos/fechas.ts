import { diaIsoDeFecha, nombreDia, nombreMes } from "@/lib/utils/date";

export type EstadoTorneo = "Próximo" | "En curso" | "Pasado";

/**
 * El estado no es un campo de la tabla: se calcula comparando fechas contra
 * hoy en cada lectura, para no depender de un cron/actualización manual que
 * lo deje desactualizado.
 */
export function estadoTorneo(fechaInicio: string, fechaFin: string, hoy: string): EstadoTorneo {
  if (hoy < fechaInicio) return "Próximo";
  if (hoy > fechaFin) return "Pasado";
  return "En curso";
}

/** Días entre `hoy` y `fechaInicio` (ambas `YYYY-MM-DD`). Negativo si ya pasó. */
export function diasHastaTorneo(fechaInicio: string, hoy: string): number {
  const [anioH, mesH, diaH] = hoy.split("-").map(Number);
  const [anioI, mesI, diaI] = fechaInicio.split("-").map(Number);
  const msPorDia = 24 * 60 * 60 * 1000;
  const diffMs = Date.UTC(anioI, mesI - 1, diaI) - Date.UTC(anioH, mesH - 1, diaH);
  return Math.round(diffMs / msPorDia);
}

/**
 * Fecha en lenguaje natural: "1 de noviembre" (un solo día), "7 al 9 de
 * septiembre" (rango dentro del mes) o "14 de noviembre al 2 de diciembre"
 * (rango que cruza meses). Si además cruza años, suma el año a cada punta.
 */
export function formatRangoFechasTorneo(fechaInicio: string, fechaFin: string): string {
  const [anioInicio, mesInicio, diaInicio] = fechaInicio.split("-").map(Number);
  const [anioFin, mesFin, diaFin] = fechaFin.split("-").map(Number);

  const puntaInicio = (conAnio: boolean) =>
    `${diaInicio} de ${nombreMes(mesInicio).toLowerCase()}${conAnio ? ` de ${anioInicio}` : ""}`;
  const puntaFin = (conAnio: boolean) =>
    `${diaFin} de ${nombreMes(mesFin).toLowerCase()}${conAnio ? ` de ${anioFin}` : ""}`;

  if (fechaInicio === fechaFin) {
    return puntaInicio(false);
  }

  const cruzaAnio = anioInicio !== anioFin;

  if (!cruzaAnio && mesInicio === mesFin) {
    return `${diaInicio} al ${diaFin} de ${nombreMes(mesInicio).toLowerCase()}`;
  }

  return `${puntaInicio(cruzaAnio)} al ${puntaFin(cruzaAnio)}`;
}

/**
 * El rango con el día de la semana adelante: «sáb 12 al lun 14 de septiembre»,
 * «sáb 4 de octubre». Solo en el destacado, donde saber si el evento cae en
 * fin de semana es parte de lo que se mira; en la lista el día grande de la
 * izquierda ya lo dice.
 */
export function formatRangoConDiaDeSemana(fechaInicio: string, fechaFin: string): string {
  const rango = formatRangoFechasTorneo(fechaInicio, fechaFin);
  const abrev = (fecha: string) => nombreDia(diaIsoDeFecha(fecha)).slice(0, 3).toLowerCase();

  if (fechaInicio === fechaFin) return `${abrev(fechaInicio)} ${rango}`;
  return `${abrev(fechaInicio)} ${rango.replace(" al ", ` al ${abrev(fechaFin)} `)}`;
}
