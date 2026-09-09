"use client";

import { useMemo, useState } from "react";
import {
  diaIsoDeFecha,
  fechasDelMesPorDia,
  mesAnteriorSiguiente,
  nombreDia,
  nombreMes,
} from "@/lib/utils/date";

/**
 * Una fecha de clase, elegida entre las que el grupo realmente entrena.
 *
 * Editar y duplicar tenían un `<input type="date">` libre, así que se podía
 * elegir un domingo y el error aparecía recién al guardar («Ese grupo no tiene
 * clase ese día de la semana»): el formulario ofrecía algo que el servidor
 * después rechazaba. Acá directamente no se puede elegir mal, que es el mismo
 * criterio que ya usaba la carga de una planificación nueva.
 *
 * A diferencia de aquélla, esto elige **una sola** fecha, así que no hace falta
 * elegir primero el día de la semana: se listan todas las fechas de clase del
 * mes juntas, con el día debajo del número.
 */
export function SelectorFechaDeClase({
  name,
  diasDisponibles,
  anioInicial,
  mesInicial,
  value,
  onChange,
  fechaExtra,
}: {
  name: string;
  /** Días ISO (1=lunes...7=domingo) en los que el grupo entrena, según `grupo_horarios`. */
  diasDisponibles: number[];
  /** El mes que se muestra al abrir. Viene del servidor para que no dependa del reloj del navegador. */
  anioInicial: number;
  mesInicial: number;
  /** Controlado: el formulario necesita la fecha para el horario y para el submit. */
  value: string;
  onChange: (fecha: string) => void;
  /**
   * Una fecha que se acepta aunque no caiga en un día de horario: la que la
   * clase ya tiene cargada. Las clases viejas pueden estar en un día que el
   * grupo dejó de entrenar, y no poder guardarlas sin moverlas de fecha sería
   * peor que el problema que este selector viene a resolver.
   */
  fechaExtra?: string;
}) {
  const [anio, setAnio] = useState(anioInicial);
  const [mes, setMes] = useState(mesInicial);

  const fechasDelMes = useMemo(() => {
    const propias = diasDisponibles.flatMap((dia) => fechasDelMesPorDia(anio, mes, dia));
    const mesVisible = `${anio}-${String(mes).padStart(2, "0")}`;
    const extra =
      fechaExtra && fechaExtra.startsWith(mesVisible) && !propias.includes(fechaExtra)
        ? [fechaExtra]
        : [];
    return [...propias, ...extra].sort();
  }, [diasDisponibles, anio, mes, fechaExtra]);

  const { anterior, siguiente } = mesAnteriorSiguiente(anio, mes);

  function irAlMes(destino: { anio: number; mes: number }) {
    setAnio(destino.anio);
    setMes(destino.mes);
  }

  const flecha =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-primary-600 transition-colors duration-[var(--duration-fast)] ease-standard hover:border-border-strong hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={value} />

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
        <button
          type="button"
          onClick={() => irAlMes(anterior)}
          aria-label={`Mes anterior: ${nombreMes(anterior.mes)} ${anterior.anio}`}
          className={flecha}
        >
          <span aria-hidden="true">←</span>
        </button>
        <span className="text-base font-semibold">
          {nombreMes(mes)} {anio}
        </span>
        <button
          type="button"
          onClick={() => irAlMes(siguiente)}
          aria-label={`Mes siguiente: ${nombreMes(siguiente.mes)} ${siguiente.anio}`}
          className={flecha}
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>

      {fechasDelMes.length === 0 ? (
        <p className="text-sm text-text-subtle">
          Este grupo no tiene clases en {nombreMes(mes).toLowerCase()}.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {fechasDelMes.map((f) => {
            const activa = f === value;
            const dia = Number(f.slice(8, 10));
            return (
              <button
                key={f}
                type="button"
                onClick={() => onChange(f)}
                aria-pressed={activa}
                aria-label={`${nombreDia(diaIsoDeFecha(f))} ${dia} de ${nombreMes(mes).toLowerCase()}`}
                className={`flex h-14 w-14 flex-col items-center justify-center rounded-lg border transition-colors duration-[var(--duration-fast)] ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                  activa
                    ? "border-primary-500 bg-primary-500 text-on-primary"
                    : "border-border text-text-muted hover:border-border-strong"
                }`}
              >
                <span className="text-base font-semibold tabular-nums">{dia}</span>
                <span className="text-xs uppercase">
                  {nombreDia(diaIsoDeFecha(f)).slice(0, 3).toLowerCase()}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
