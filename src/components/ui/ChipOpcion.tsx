"use client";

/**
 * Una opción tocable de un grupo chico y excluyente: el día de la semana, el
 * tipo de clase, el tipo de evento, «Un día / Varios días».
 *
 * Reemplaza a los `select` nativos, que en el celular abren la rueda de iOS
 * para elegir entre dos o tres opciones. El criterio del modelo `Pe`: cuando
 * las opciones entran en pantalla, se muestran; el `select` se reserva para
 * listas largas.
 *
 * Alto mínimo de 44px, que es el objetivo táctil que usa el resto del
 * rediseño (el pie de Asistencia, los botones de la lista de Torneos).
 */
export function ChipOpcion({
  activo,
  onClick,
  children,
  className = "",
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
        activo
          ? "border-primary-500 bg-primary-500 text-on-primary"
          : "border-border text-text-muted hover:border-border-strong"
      } ${className}`}
    >
      {children}
    </button>
  );
}
