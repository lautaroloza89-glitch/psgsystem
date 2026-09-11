"use client";

import { useMemo, useState, useTransition } from "react";
import type { Convocada } from "@/lib/torneos/convocatoria";
import type { EstadoInscripcion } from "@/types";
import {
  alternarRecargoInscripcion,
  cambiarEstadoInscripcion,
  guardarCategoria,
  guardarMontoInscripcion,
  quitarConvocada,
} from "@/app/(dashboard)/torneos/convocatoria-actions";
import { RECARGO_MONTO, totalInscripcion } from "@/lib/torneos/inscripcion";
import { formatMonto, formatNumero, parsearMonto } from "@/lib/utils/money";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/EmptyState";

const CLASE_FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

type Filtro = "todas" | "sin-pagar" | "sin-categoria";

/** `20/09/2017`, como en la planilla. */
function formatFechaNacimiento(fecha: string | null): string | null {
  if (!fecha) return null;
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

/**
 * La lista del torneo: es la planilla que se manda a la organización, con las
 * mismas columnas — nombre, DNI, fecha de nacimiento y categoría.
 *
 * Encima va el control de inscripciones, que es la vista de trabajo de Dai. La
 * categoría se escribe acá, a mano y por torneo: no se modelan categorías
 * federativas porque son demasiadas y cambian por torneo y federación.
 */
export function ListaConvocadas({
  torneoId,
  convocadas,
  puedeGestionar,
  verPlata,
}: {
  torneoId: string;
  convocadas: Convocada[];
  puedeGestionar: boolean;
  /** La Profesora ve nombres y categorías, no el estado de pago ni el monto. */
  verPlata: boolean;
}) {
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();
  // El último monto que se escribió a mano en esta pantalla.
  const [ultimoMonto, setUltimoMonto] = useState<number | null>(null);

  // La cascada: el monto cargado a una alumna se sugiere en las casillas
  // vacías de las demás. Es solo un valor en el campo — no se guarda hasta
  // que se actúa sobre esa fila, y nunca pisa un monto ya cargado.
  const sugerencia =
    ultimoMonto ?? convocadas.find((c) => c.inscripcionMonto != null)?.inscripcionMonto ?? null;

  const sinPagar = useMemo(
    () => convocadas.filter((c) => c.inscripcionEstado === "Pendiente").length,
    [convocadas]
  );
  const sinCategoria = useMemo(
    () => convocadas.filter((c) => !c.categoria?.trim()).length,
    [convocadas]
  );

  const visibles = useMemo(() => {
    if (filtro === "sin-pagar") return convocadas.filter((c) => c.inscripcionEstado === "Pendiente");
    if (filtro === "sin-categoria") return convocadas.filter((c) => !c.categoria?.trim());
    return convocadas;
  }, [convocadas, filtro]);

  function ejecutar(accion: () => Promise<{ error: string | null }>) {
    setError(null);
    startTransition(async () => {
      const resultado = await accion();
      if (resultado?.error) setError(resultado.error);
    });
  }

  if (convocadas.length === 0) {
    return <EmptyState mensaje="Todavía no hay nadie convocado a este torneo." />;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <ChipFiltro activo={filtro === "todas"} onClick={() => setFiltro("todas")}>
          Todas · {convocadas.length}
        </ChipFiltro>
        {verPlata && sinPagar > 0 && (
          <ChipFiltro activo={filtro === "sin-pagar"} onClick={() => setFiltro("sin-pagar")}>
            Sin pagar · {sinPagar}
          </ChipFiltro>
        )}
        {/* Avisa a quién le falta el dato antes de exportar la planilla. */}
        {sinCategoria > 0 && (
          <ChipFiltro
            activo={filtro === "sin-categoria"}
            onClick={() => setFiltro("sin-categoria")}
          >
            Sin categoría · {sinCategoria}
          </ChipFiltro>
        )}
      </div>

      {error && (
        <p role="alert" aria-live="assertive" className="text-sm text-error-600">
          {error}
        </p>
      )}

      <ul className="space-y-2">
        {visibles.map((c) => {
          const sugerenciaFila = c.inscripcionMonto == null ? sugerencia : null;
          return (
          <li
            key={c.id}
            className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">
                  {c.apellido}, {c.nombre}
                </p>
                <p className="text-sm text-text-subtle">
                  {c.dni ? `DNI ${c.dni}` : "Sin DNI"}
                  {formatFechaNacimiento(c.fechaNacimiento)
                    ? ` · ${formatFechaNacimiento(c.fechaNacimiento)}`
                    : ""}
                </p>
                {!c.fechaNacimiento && (
                  <p className="text-sm text-warning-800">Sin fecha de nacimiento</p>
                )}
              </div>

              {verPlata && c.inscripcionEstado && (
                <EstadoInscripcionControl
                  estado={c.inscripcionEstado}
                  monto={totalInscripcion(c)}
                  puedeGestionar={puedeGestionar}
                  pendiente={pendiente}
                  onCambiar={(nuevo) =>
                    ejecutar(() =>
                      cambiarEstadoInscripcion(
                        torneoId,
                        c.id,
                        nuevo,
                        nuevo === "Paga" ? sugerenciaFila : null
                      )
                    )
                  }
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <CampoCategoria
                valorInicial={c.categoria ?? ""}
                puedeEditar={puedeGestionar}
                onGuardar={(valor) => ejecutar(() => guardarCategoria(torneoId, c.id, valor))}
              />
              {verPlata && (
                <>
                  <CampoMonto
                    valorGuardado={c.inscripcionMonto}
                    sugerencia={sugerenciaFila}
                    puedeEditar={puedeGestionar}
                    onGuardar={(monto) => {
                      if (monto !== null) setUltimoMonto(monto);
                      ejecutar(() => guardarMontoInscripcion(torneoId, c.id, monto));
                    }}
                  />
                  {/* Prendido: el total cobrado a la alumna incluye el recargo.
                      Mismo valor que en cuotas (`RECARGO_MONTO`), y se marca a
                      mano: no se aplica solo por fecha. */}
                  {puedeGestionar ? (
                    <button
                      type="button"
                      aria-pressed={!!c.recargoAplicado}
                      disabled={pendiente}
                      onClick={() =>
                        ejecutar(() =>
                          alternarRecargoInscripcion(
                            torneoId,
                            c.id,
                            !c.recargoAplicado,
                            sugerenciaFila
                          )
                        )
                      }
                      className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard disabled:opacity-50 ${CLASE_FOCO} ${
                        c.recargoAplicado
                          ? "border-primary-500 bg-primary-500 text-on-primary"
                          : "border-border text-text-subtle hover:border-border-strong hover:text-text"
                      }`}
                    >
                      {c.recargoAplicado ? "Con recargo" : "+ Recargo"} {formatMonto(RECARGO_MONTO)}
                    </button>
                  ) : (
                    c.recargoAplicado && (
                      <span className="text-sm text-text-subtle">
                        + recargo {formatMonto(RECARGO_MONTO)}
                      </span>
                    )
                  )}
                </>
              )}
              {puedeGestionar && (
                <button
                  type="button"
                  disabled={pendiente}
                  onClick={() => {
                    if (!confirm(`¿Sacar a ${c.nombre} ${c.apellido} de este torneo?`)) return;
                    ejecutar(() => quitarConvocada(torneoId, c.id));
                  }}
                  className={`ml-auto rounded-md border border-error-300 px-3 py-1.5 text-sm font-medium text-error-700 transition-colors duration-[var(--duration-fast)] ease-standard hover:border-error-500 hover:bg-error-50 disabled:opacity-50 ${CLASE_FOCO}`}
                >
                  Sacar
                </button>
              )}
            </div>
          </li>
          );
        })}
      </ul>

      {visibles.length === 0 && (
        <EmptyState mensaje="Ninguna convocada entra en este filtro." />
      )}
    </div>
  );
}

/**
 * La categoría: un campo de texto que guarda al salir del foco.
 *
 * Sin botón de guardar por fila — con doce alumnas serían doce botones y doce
 * confirmaciones. El estado vacío dice qué escribir con un ejemplo, porque
 * «categoría» a secas no dice en qué formato.
 */
function CampoCategoria({
  valorInicial,
  puedeEditar,
  onGuardar,
}: {
  valorInicial: string;
  puedeEditar: boolean;
  onGuardar: (valor: string) => void;
}) {
  const [valor, setValor] = useState(valorInicial);

  if (!puedeEditar) {
    return (
      <p className="text-sm">
        <span className="text-text-subtle">Categoría: </span>
        {valorInicial || <span className="text-text-subtle">sin cargar</span>}
      </p>
    );
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-text-subtle">Categoría</span>
      <input
        type="text"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onBlur={() => {
          if (valor.trim() !== valorInicial.trim()) onGuardar(valor);
        }}
        placeholder="Escribila — ej. C4 10"
        className={`w-36 rounded-md border border-border-strong px-2 py-1.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard focus:border-primary-500 ${CLASE_FOCO}`}
      />
    </label>
  );
}

/**
 * El monto de la inscripción: mismo comportamiento que la categoría — se
 * escribe en la fila y se guarda al salir del foco (o con Enter).
 *
 * Si la fila no tiene monto propio y otra alumna del torneo sí, el campo
 * muestra ese valor como **sugerencia**, en gris. Es solo eso: no se guarda por
 * aparecer. Queda confirmado si se edita, si se toca Enter sobre él, o si se
 * marca la inscripción paga o con recargo.
 */
function CampoMonto({
  valorGuardado,
  sugerencia,
  puedeEditar,
  onGuardar,
}: {
  valorGuardado: number | null;
  sugerencia: number | null;
  puedeEditar: boolean;
  onGuardar: (monto: number | null) => void;
}) {
  const [texto, setTexto] = useState("");
  const [tocado, setTocado] = useState(false);
  const [invalido, setInvalido] = useState(false);

  if (!puedeEditar) {
    return (
      <p className="text-sm">
        <span className="text-text-subtle">Monto: </span>
        {valorGuardado != null ? (
          formatMonto(valorGuardado)
        ) : (
          <span className="text-text-subtle">sin cargar</span>
        )}
      </p>
    );
  }

  const muestraSugerencia = !tocado && valorGuardado == null && sugerencia != null;
  const valor = tocado
    ? texto
    : valorGuardado != null
      ? formatNumero(valorGuardado)
      : sugerencia != null
        ? formatNumero(sugerencia)
        : "";

  function guardar() {
    if (!tocado) return;
    const monto = parsearMonto(texto);
    if (monto !== null && Number.isNaN(monto)) {
      setInvalido(true);
      return;
    }
    setInvalido(false);
    if (monto === valorGuardado) return;
    onGuardar(monto);
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-text-subtle">Monto $</span>
      <input
        type="text"
        inputMode="numeric"
        value={valor}
        onChange={(e) => {
          setTocado(true);
          setTexto(e.target.value);
        }}
        onBlur={guardar}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          // Enter sobre la sugerencia sin tocarla es la forma de aceptarla.
          if (muestraSugerencia && sugerencia != null) {
            setTocado(true);
            setTexto(formatNumero(sugerencia));
            onGuardar(sugerencia);
            return;
          }
          e.currentTarget.blur();
        }}
        placeholder="Escribilo"
        aria-invalid={invalido}
        title={muestraSugerencia ? "Sugerido: se guarda al editarlo, con Enter o al marcarla paga" : undefined}
        className={`w-28 rounded-md border px-2 py-1.5 text-sm tabular-nums transition-colors duration-[var(--duration-fast)] ease-standard focus:border-primary-500 ${CLASE_FOCO} ${
          invalido ? "border-error-500" : "border-border-strong"
        } ${muestraSugerencia ? "italic text-text-subtle" : ""}`}
      />
      {muestraSugerencia && <span className="text-xs text-text-subtle">sugerido</span>}
      {invalido && <span className="text-xs text-error-600">no es un monto</span>}
    </label>
  );
}

const ESTADOS: EstadoInscripcion[] = ["Pendiente", "Paga", "Exenta"];

const ESTILO_ESTADO: Record<EstadoInscripcion, string> = {
  Paga: "border-success-300 bg-success-50 text-success-800",
  Pendiente: "border-warning-300 bg-warning-50 text-warning-800",
  Exenta: "border-border bg-surface-muted text-text-muted",
};

/**
 * El estado de la inscripción, que rota con un toque.
 *
 * No abre el formulario de Pagos: lo que la alumna paga para competir se gira
 * a la organización del torneo y no entra al club, así que no pasa por `pagos`
 * ni suma a la recaudación (decisión de Lauti, 2026-09-09). Acá se lleva el
 * control y nada más.
 */
function EstadoInscripcionControl({
  estado,
  monto,
  puedeGestionar,
  pendiente,
  onCambiar,
}: {
  estado: EstadoInscripcion;
  monto: number | null;
  puedeGestionar: boolean;
  pendiente: boolean;
  onCambiar: (estado: EstadoInscripcion) => void;
}) {
  // `monto` ya trae el recargo sumado si se aplicó.
  const etiqueta =
    estado === "Pendiente"
      ? monto
        ? `Sin pagar · ${formatMonto(monto)}`
        : "Sin pagar"
      : estado === "Paga" && monto
        ? `Paga · ${formatMonto(monto)}`
        : estado;

  const clase = `flex-none rounded-full border px-3 py-1 text-sm font-medium ${ESTILO_ESTADO[estado]}`;

  if (!puedeGestionar) {
    return <span className={clase}>{etiqueta}</span>;
  }

  const siguiente = ESTADOS[(ESTADOS.indexOf(estado) + 1) % ESTADOS.length];

  return (
    <button
      type="button"
      disabled={pendiente}
      onClick={() => onCambiar(siguiente)}
      title={`Marcar como ${siguiente === "Pendiente" ? "sin pagar" : siguiente.toLowerCase()}`}
      className={`${clase} inline-flex items-center gap-1.5 transition-colors duration-[var(--duration-fast)] ease-standard disabled:opacity-50 ${CLASE_FOCO}`}
    >
      {pendiente && <Spinner className="h-3 w-3" />}
      {etiqueta}
    </button>
  );
}

function ChipFiltro({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard ${CLASE_FOCO} ${
        activo
          ? "border-primary-500 bg-primary-500 text-on-primary"
          : "border-border text-text-muted hover:border-border-strong"
      }`}
    >
      {children}
    </button>
  );
}
