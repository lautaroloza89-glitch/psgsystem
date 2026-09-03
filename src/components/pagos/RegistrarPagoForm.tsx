"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { crearPago, obtenerSaldoAlumnaMes, type FormState } from "@/app/(dashboard)/pagos/actions";
import type { SaldoAlumnaMes } from "@/lib/pagos/saldo";
import { RECARGO_MONTO } from "@/lib/pagos/reglas";
import { normalizarTexto } from "@/lib/utils/texto";
import { formatMonto } from "@/lib/utils/money";
import type { MetodoPago } from "@/types";
import { Spinner } from "@/components/ui/spinner";

const INPUT_CLASS =
  "w-full rounded-md border border-border-strong px-3 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-focus-ring";

const METODOS: { value: MetodoPago; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "debito", label: "Débito" },
];

interface AlumnaOpcion {
  id: string;
  apellido: string;
  nombre: string;
  grupoNombre: string;
}

interface ContactoOpcion {
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
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
}

const initialState: FormState = { error: null };

export function RegistrarPagoForm({
  alumnas,
  contactosPorAlumna,
}: {
  alumnas: AlumnaOpcion[];
  contactosPorAlumna: Record<string, ContactoOpcion[]>;
}) {
  const [state, formAction, pending] = useActionState(crearPago, initialState);

  const [busqueda, setBusqueda] = useState("");
  const [alumna, setAlumna] = useState<AlumnaOpcion | null>(null);
  const [mes, setMes] = useState(mesActualInput());
  const [contactoId, setContactoId] = useState("");
  const [metodos, setMetodos] = useState<MetodoRow[]>([{ key: nuevaKey(), metodo: "efectivo", monto: "" }]);
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

  function agregarMetodo() {
    setMetodos((prev) => [...prev, { key: nuevaKey(), metodo: "efectivo", monto: "" }]);
  }

  function quitarMetodo(key: string) {
    setMetodos((prev) => (prev.length > 1 ? prev.filter((m) => m.key !== key) : prev));
  }

  function actualizarMetodoTipo(key: string, valor: MetodoPago) {
    setMetodos((prev) => prev.map((m) => (m.key === key ? { ...m, metodo: valor } : m)));
  }

  function actualizarMetodoMonto(key: string, valor: string) {
    setMetodos((prev) => prev.map((m) => (m.key === key ? { ...m, monto: valor } : m)));
  }

  const totalMetodos = metodos.reduce((acc, m) => acc + (Number(m.monto) || 0), 0);

  const montoEsperadoTotal = saldo ? saldo.montoCuota + (incluirRecargo ? RECARGO_MONTO : 0) : null;
  const pendienteAntesDeEstePago =
    montoEsperadoTotal !== null && saldo ? montoEsperadoTotal - saldo.montoPagadoVerificado : null;
  const saldoTrasEstePago =
    pendienteAntesDeEstePago !== null ? pendienteAntesDeEstePago - totalMetodos : null;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="alumna_id" value={alumna?.id ?? ""} readOnly />

      <div className="space-y-1.5">
        <label className="text-label font-medium">Alumna</label>
        {alumna ? (
          <div className="flex items-center justify-between gap-2 rounded-md border border-border-strong bg-surface-muted px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">
                {alumna.apellido}, {alumna.nombre}
              </p>
              <p className="text-sm text-text-subtle">{alumna.grupoNombre}</p>
            </div>
            <button
              type="button"
              onClick={cambiarAlumna}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por apellido o nombre"
              aria-label="Buscar alumna"
              className={INPUT_CLASS}
            />
            {alumnasFiltradas.length > 0 && (
              <ul className="divide-y divide-border rounded-md border border-border">
                {alumnasFiltradas.map((op) => (
                  <li key={op.id}>
                    <button
                      type="button"
                      onClick={() => elegirAlumna(op)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-surface-muted"
                    >
                      <span className="font-medium">
                        {op.apellido}, {op.nombre}
                      </span>
                      <span className="text-text-subtle">{op.grupoNombre}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {busqueda.trim() && alumnasFiltradas.length === 0 && (
              <p className="text-sm text-text-subtle">Ninguna alumna coincide con la búsqueda.</p>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="mes_correspondiente" className="text-label font-medium">
            Mes correspondiente
          </label>
          <input
            id="mes_correspondiente"
            name="mes_correspondiente"
            type="month"
            required
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="contacto_id" className="text-label font-medium">
            Quién paga <span className="font-normal text-text-subtle">(opcional)</span>
          </label>
          <select
            id="contacto_id"
            name="contacto_id"
            value={contactoId}
            onChange={(e) => setContactoId(e.target.value)}
            disabled={!alumna}
            className={INPUT_CLASS}
          >
            <option value="">Sin especificar</option>
            {contactosAlumna.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
                {c.esPagadorPrincipal ? " (pagador principal)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {alumna && (
        <div className="rounded-md border border-border bg-surface-muted px-3 py-2.5 text-sm">
          {cargandoSaldo && "Calculando cuota..."}
          {!cargandoSaldo && saldoError && <span className="text-error-600">{saldoError}</span>}
          {!cargandoSaldo && saldo && (
            <>
              Cuota del mes: <span className="font-medium">{formatMonto(saldo.montoCuota)}</span>
              {saldo.montoPagadoVerificado > 0 && (
                <> · ya pagado y verificado: {formatMonto(saldo.montoPagadoVerificado)}</>
              )}
            </>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-label font-medium">Métodos de pago</span>
          <button
            type="button"
            onClick={agregarMetodo}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            + Agregar método
          </button>
        </div>

        {metodos.map((fila, i) => (
          <div key={fila.key} className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
            <div className="space-y-1.5">
              {i === 0 && <label className="text-sm font-medium">Método</label>}
              <select
                name="metodo"
                value={fila.metodo}
                onChange={(e) => actualizarMetodoTipo(fila.key, e.target.value as MetodoPago)}
                className={INPUT_CLASS}
              >
                {METODOS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              {i === 0 && <label className="text-sm font-medium">Monto</label>}
              <input
                name="metodo_monto"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={fila.monto}
                onChange={(e) => actualizarMetodoMonto(fila.key, e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <button
              type="button"
              onClick={() => quitarMetodo(fila.key)}
              disabled={metodos.length === 1}
              className="mb-0.5 h-11 text-sm font-medium text-error-600 hover:text-error-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Quitar
            </button>
          </div>
        ))}

        <p className="text-sm text-text-subtle">Total cargado: {formatMonto(totalMetodos)}</p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="incluir_recargo"
          checked={incluirRecargo}
          onChange={(e) => {
            setIncluirRecargo(e.target.checked);
            setRecargoTocado(true);
          }}
          className="h-4 w-4 rounded border-border-strong text-primary-500 focus:ring-focus-ring"
        />
        Incluir recargo ({formatMonto(RECARGO_MONTO)})
      </label>

      {saldoTrasEstePago !== null && totalMetodos > 0 && (
        <p className="text-sm text-text-subtle">
          {saldoTrasEstePago > 0
            ? `Quedan ${formatMonto(saldoTrasEstePago)} pendientes de este mes.`
            : "Con este pago se completa el mes."}
        </p>
      )}

      {state.error && (
        <p role="alert" aria-live="assertive" className="text-sm text-error-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !alumna}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-500 py-2.5 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {pending && <Spinner />}
        {pending ? "Guardando..." : "Registrar pago"}
      </button>
    </form>
  );
}
