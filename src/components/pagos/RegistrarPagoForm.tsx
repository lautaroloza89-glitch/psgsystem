"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { crearPago, obtenerSaldoAlumnaMes, type FormState } from "@/app/(dashboard)/pagos/actions";
import type { SaldoAlumnaMes } from "@/lib/pagos/saldo";
import { RECARGO_MONTO } from "@/lib/pagos/reglas";
import { normalizarTexto } from "@/lib/utils/texto";
import { hoyArgentina, nombreMes } from "@/lib/utils/date";
import { formatMonto } from "@/lib/utils/money";
import { primerNombre } from "@/lib/utils/whatsapp";
import type { MetodoPago } from "@/types";
import { Spinner } from "@/components/ui/spinner";

/**
 * Cobrar.
 *
 * Cuando se entra desde «Cobrar» en Deudoras, la alumna y el mes ya vienen
 * resueltos y el formulario **arranca por el dinero**: antes había que pasar
 * por buscador, mes y contacto para llegar ahí, y el total, el recargo y el
 * botón quedaban abajo del scroll.
 *
 * El recargo deja de ser una casilla que se autotildaba sola sin decir nada:
 * aparece **sumado, con su motivo**, y se saca de un toque. Misma regla del
 * día 10.
 */

const CLASE_FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

const INPUT_CLASS = `w-full rounded-lg border border-border-strong px-3 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard focus:border-primary-500 ${CLASE_FOCO}`;

const METODOS: { value: MetodoPago; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transfer." },
  { value: "debito", label: "Débito" },
];

export interface AlumnaOpcion {
  id: string;
  apellido: string;
  nombre: string;
  grupoNombre: string;
}

export interface ContactoOpcion {
  id: string;
  nombre: string;
  esPagadorPrincipal: boolean;
}

interface MetodoRow {
  key: string;
  metodo: MetodoPago;
  monto: string;
}

function nuevaKey(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function mesActualInput(): string {
  return hoyArgentina().slice(0, 7);
}

/** «septiembre 2026» a partir de `YYYY-MM`. */
function mesLargo(mesInput: string): string {
  const [anio, mesNum] = mesInput.split("-").map(Number);
  return `${nombreMes(mesNum).toLowerCase()} ${anio}`;
}

const initialState: FormState = { error: null };

/** Chip: la selección de una opción entre pocas, con área de toque real. */
function Chip({
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
      aria-pressed={activo}
      onClick={onClick}
      className={`h-11 rounded-lg border px-4 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard ${CLASE_FOCO} ${
        activo
          ? "border-primary-500 bg-primary-500 text-on-primary"
          : "border-border bg-surface text-text-subtle hover:border-border-strong hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

export function RegistrarPagoForm({
  alumnas,
  contactosPorAlumna,
  alumnaInicial = null,
  mesInicial,
}: {
  alumnas: AlumnaOpcion[];
  contactosPorAlumna: Record<string, ContactoOpcion[]>;
  /** Viene resuelta cuando se entra por «Cobrar» desde Deudoras. */
  alumnaInicial?: AlumnaOpcion | null;
  mesInicial?: string;
}) {
  const [state, formAction, pending] = useActionState(crearPago, initialState);

  const [busqueda, setBusqueda] = useState("");
  const [alumna, setAlumna] = useState<AlumnaOpcion | null>(alumnaInicial);
  const [mes, setMes] = useState(mesInicial ?? mesActualInput());
  const [contactoId, setContactoId] = useState(
    alumnaInicial
      ? (contactosPorAlumna[alumnaInicial.id] ?? []).find((c) => c.esPagadorPrincipal)?.id ?? ""
      : ""
  );
  const [metodos, setMetodos] = useState<MetodoRow[]>([
    { key: nuevaKey(), metodo: "efectivo", monto: "" },
  ]);
  const [incluirRecargo, setIncluirRecargo] = useState(false);
  const [recargoTocado, setRecargoTocado] = useState(false);
  const [saldo, setSaldo] = useState<SaldoAlumnaMes | null>(null);
  const [saldoError, setSaldoError] = useState<string | null>(null);
  const [cargandoSaldo, startTransition] = useTransition();

  const contactosAlumna = alumna ? contactosPorAlumna[alumna.id] ?? [] : [];

  const alumnasFiltradas = useMemo(() => {
    const busquedaNormalizada = normalizarTexto(busqueda.trim());
    if (!busquedaNormalizada) return [];
    return alumnas
      .filter((a) => normalizarTexto(`${a.apellido} ${a.nombre}`).includes(busquedaNormalizada))
      .slice(0, 15);
  }, [alumnas, busqueda]);

  useEffect(() => {
    if (!alumna) {
      setSaldo(null);
      setSaldoError(null);
      return;
    }
    startTransition(async () => {
      const result = await obtenerSaldoAlumnaMes(alumna.id, mes);
      if (result.error || !result.saldo) {
        setSaldo(null);
        setSaldoError(result.error ?? "No se pudo calcular el saldo.");
        return;
      }
      setSaldoError(null);
      setSaldo(result.saldo);
      if (!recargoTocado) {
        setIncluirRecargo(result.saldo.sugerirRecargo);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alumna, mes]);

  function elegirAlumna(op: AlumnaOpcion) {
    setAlumna(op);
    setBusqueda("");
    setRecargoTocado(false);
    const contactos = contactosPorAlumna[op.id] ?? [];
    setContactoId(contactos.find((c) => c.esPagadorPrincipal)?.id ?? "");
  }

  function cambiarAlumna() {
    setAlumna(null);
    setContactoId("");
    setSaldo(null);
    setSaldoError(null);
  }

  const recargo = incluirRecargo ? RECARGO_MONTO : 0;
  const aCobrar = saldo ? Math.max(0, saldo.saldoSinRecargo) + recargo : 0;
  const totalCargado = metodos.reduce((acc, m) => acc + (Number(m.monto) || 0), 0);
  const saldoTrasElPago = saldo ? saldo.saldoSinRecargo + recargo - totalCargado : 0;

  function setMonto(key: string, monto: string) {
    setMetodos((prev) => prev.map((m) => (m.key === key ? { ...m, monto } : m)));
  }

  // ─────────────────────────── Paso 1: elegir alumna ───────────────────────────
  if (!alumna) {
    return (
      <div className="space-y-3">
        <label htmlFor="buscar-alumna" className="block text-sm font-medium">
          ¿A quién le cobrás?
        </label>
        <input
          id="buscar-alumna"
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Apellido o nombre"
          autoFocus
          className={INPUT_CLASS}
        />

        {busqueda.trim().length > 0 && alumnasFiltradas.length === 0 && (
          <p className="text-sm text-text-subtle">Ninguna alumna coincide con esa búsqueda.</p>
        )}

        {alumnasFiltradas.length > 0 && (
          <ul className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
            {alumnasFiltradas.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => elegirAlumna(a)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
                >
                  <span className="font-medium">
                    {a.apellido}, {a.nombre}
                  </span>
                  <span className="text-sm text-text-subtle">{a.grupoNombre}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // ─────────────────────────── Paso 2: el dinero ───────────────────────────
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="alumna_id" value={alumna.id} />
      <input type="hidden" name="mes_correspondiente" value={mes} />
      <input type="hidden" name="contacto_id" value={contactoId} />
      {incluirRecargo && <input type="hidden" name="incluir_recargo" value="on" />}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-snug">Cobrar a {alumna.nombre}</h2>
          <p className="text-sm text-text-subtle">
            {alumna.grupoNombre} · {mesLargo(mes)}
          </p>
        </div>
        <button
          type="button"
          onClick={cambiarAlumna}
          className={`shrink-0 rounded px-2 py-1 text-sm font-medium text-primary-600 hover:text-primary-700 ${CLASE_FOCO}`}
        >
          Cambiar
        </button>
      </div>

      <div>
        <label htmlFor="mes" className="block text-sm font-medium">
          Mes correspondiente
        </label>
        <input
          id="mes"
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className={`${INPUT_CLASS} mt-1`}
        />
      </div>

      {/* El resumen que antes eran dos líneas grises perdidas entre los campos. */}
      <div className="rounded-xl border border-border bg-surface p-4">
        {cargandoSaldo && !saldo ? (
          <p className="text-sm text-text-subtle">Calculando el saldo…</p>
        ) : saldoError ? (
          <p className="text-sm text-error-600">{saldoError}</p>
        ) : saldo ? (
          <dl className="space-y-1.5 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-text-subtle">Cuota de {alumna.grupoNombre}</dt>
              <dd className="font-medium tabular-nums">{formatMonto(saldo.montoCuota)}</dd>
            </div>

            {saldo.montoPagadoVerificado > 0 && (
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-text-subtle">Ya pagado y verificado</dt>
                <dd className="font-medium tabular-nums text-success-700">
                  −{formatMonto(saldo.montoPagadoVerificado)}
                </dd>
              </div>
            )}

            {incluirRecargo && (
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-text-subtle">Recargo (pasó el día 10)</dt>
                <dd className="font-medium tabular-nums">{formatMonto(RECARGO_MONTO)}</dd>
              </div>
            )}

            <div className="flex items-baseline justify-between gap-3 border-t border-border pt-1.5">
              <dt className="font-semibold">A cobrar</dt>
              <dd className="text-lg font-semibold tabular-nums">{formatMonto(aCobrar)}</dd>
            </div>
          </dl>
        ) : null}

        {saldo && (
          <button
            type="button"
            onClick={() => {
              setRecargoTocado(true);
              setIncluirRecargo((v) => !v);
            }}
            className={`mt-3 rounded text-sm font-medium text-primary-600 hover:text-primary-700 ${CLASE_FOCO}`}
          >
            {incluirRecargo ? "Sacar el recargo" : "Agregar el recargo"}
          </button>
        )}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Cómo paga</legend>

        {metodos.map((fila, i) => (
          <div key={fila.key} className="space-y-2 rounded-xl border border-border bg-surface p-3">
            <input type="hidden" name="metodo" value={fila.metodo} />
            <input type="hidden" name="metodo_monto" value={fila.monto} />

            <div className="flex flex-wrap gap-2">
              {METODOS.map((m) => (
                <Chip
                  key={m.value}
                  activo={fila.metodo === m.value}
                  onClick={() =>
                    setMetodos((prev) =>
                      prev.map((f) => (f.key === fila.key ? { ...f, metodo: m.value } : f))
                    )
                  }
                >
                  {m.label}
                </Chip>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={fila.monto}
                onChange={(e) => setMonto(fila.key, e.target.value)}
                placeholder="Monto"
                aria-label={`Monto en ${METODOS.find((m) => m.value === fila.metodo)?.label}`}
                className={INPUT_CLASS}
              />
              {/* «Todo» es el caso normal: paga lo que debe. */}
              {i === 0 && aCobrar > 0 && (
                <button
                  type="button"
                  onClick={() => setMonto(fila.key, String(aCobrar))}
                  className={`h-11 shrink-0 rounded-lg border border-border px-4 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard hover:border-border-strong ${CLASE_FOCO}`}
                >
                  Todo
                </button>
              )}
              {metodos.length > 1 && (
                <button
                  type="button"
                  onClick={() => setMetodos((prev) => prev.filter((f) => f.key !== fila.key))}
                  className={`h-11 shrink-0 rounded-lg px-3 text-sm font-medium text-text-subtle hover:text-error-600 ${CLASE_FOCO}`}
                >
                  Quitar
                </button>
              )}
            </div>
          </div>
        ))}

        {/* El pago partido se conserva, pero deja de ser lo primero que se ve. */}
        <button
          type="button"
          onClick={() =>
            setMetodos((prev) => [...prev, { key: nuevaKey(), metodo: "efectivo", monto: "" }])
          }
          className={`rounded text-sm font-medium text-primary-600 hover:text-primary-700 ${CLASE_FOCO}`}
        >
          + Otro método
        </button>
      </fieldset>

      {contactosAlumna.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Quién paga</legend>
          <div className="flex flex-wrap gap-2">
            {contactosAlumna.map((c) => (
              <Chip
                key={c.id}
                activo={contactoId === c.id}
                onClick={() => setContactoId((actual) => (actual === c.id ? "" : c.id))}
              >
                {primerNombre(c.nombre)}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}

      {state.error && (
        <p role="alert" aria-live="assertive" className="text-sm text-error-600">
          {state.error}
        </p>
      )}

      {/* Pie fijo: el saldo tras el pago y el botón dejan de estar abajo del
          scroll, que es donde vivían las dos líneas de «Total cargado». */}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] -mx-4 border-t border-border bg-surface px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] sm:-mx-8 sm:px-8">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <p aria-live="polite" className="min-w-0 flex-1 text-sm">
            <span className="block font-medium tabular-nums">
              {totalCargado > 0 ? formatMonto(totalCargado) : "Sin monto todavía"}
            </span>
            <span className="block text-text-subtle">
              {totalCargado <= 0
                ? "Entra como pendiente de verificar"
                : saldoTrasElPago <= 0
                  ? "Queda saldado · entra como pendiente de verificar"
                  : `Quedan ${formatMonto(saldoTrasElPago)} pendientes`}
            </span>
          </p>

          <button
            type="submit"
            disabled={pending || totalCargado <= 0}
            className={`flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary-500 px-6 py-2.5 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 ${CLASE_FOCO}`}
          >
            {pending && <Spinner />}
            {pending ? "Registrando..." : "Registrar"}
          </button>
        </div>
      </div>
    </form>
  );
}
