import type { NombreIcono } from "@/lib/navegacion";

/**
 * Los iconos de la barra y de los avisos, como SVG inline.
 *
 * Sin librería de iconos a propósito: son ocho trazos y no justifican una
 * dependencia nueva ni el peso que agrega al bundle de una PWA que se usa
 * desde el celular con datos móviles.
 */

const TRAZOS: Record<NombreIcono, string> = {
  house: "M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5Z",
  calendar:
    "M4 5h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm0 5h17M8 3v4m8-4v4",
  "check-square": "M4 4h16v16H4zM8.5 12l2.5 2.5 5-5",
  "users-three":
    "M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 0c-2.5 0-4.5 1.7-4.5 3.8V19h9v-4.2c0-2.1-2-3.8-4.5-3.8ZM5 10a2.5 2.5 0 1 0 0-5M5 10c-1.6 0-3 1.2-3 2.7V16m17-6a2.5 2.5 0 1 1 0-5m0 5c1.6 0 3 1.2 3 2.7V16",
  money:
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v10m3-7.5c0-1.1-1.3-2-3-2s-3 .9-3 2 1.3 2 3 2 3 .9 3 2-1.3 2-3 2-3-.9-3-2",
  trophy:
    "M7 4h10v5a5 5 0 0 1-10 0V4Zm0 1H4v2a3 3 0 0 0 3 3m10-5h3v2a3 3 0 0 1-3 3m-5 4v4m-3 3h6",
  "list-checks": "M3 6l2 2 3-3M3 14l2 2 3-3M11 6h10M11 15h10",
  dots: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8.5 12h.01M12 12h.01M15.5 12h.01",
  // La hoja escrita: marca que un torneo tiene notas y que una clase tiene
  // planificación cargada. Es el mismo contenido largo en los dos módulos.
  note: "M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm8 0v6h5M9 13h6M9 17h4",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-3.5v.01",
  plus: "M12 5v14M5 12h14",
};

export function Icono({
  nombre,
  className = "h-6 w-6",
  relleno = false,
}: {
  nombre: NombreIcono;
  className?: string;
  /** La pestaña activa se dibuja con más cuerpo, para que se lea sin depender solo del color. */
  relleno?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={relleno ? 2.4 : 1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}
