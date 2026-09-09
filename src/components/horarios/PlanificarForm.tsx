"use client";

import { useActionState, useMemo, useState } from "react";
import type { FormState } from "@/app/(dashboard)/horarios/actions";
import type { Rol, User } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { ChipsResponsables } from "@/components/tareas/ChipsResponsables";
import { ChipOpcion } from "@/components/ui/ChipOpcion";
import { fechasDelMesPorDia, nombreDia } from "@/lib/utils/date";

const INPUT_CLASS =
  "w-full rounded-md border border-border-strong px-3 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-standard focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-focus-ring";

const initialState: FormState = { error: null };

/**
 * Mismos campos, mismo orden y misma lógica de upsert que antes: lo que cambia
 * es cómo se tocan desde el celular.
 *
 * Los dos `select` nativos abrían la rueda de iOS para elegir entre dos o tres
 * opciones; ahora son chips. Las fechas eran una columna de checkboxes con la
 * fecha larga escrita al lado, así que el textarea y el botón de guardar
 * quedaban abajo del scroll después de las cuatro profesoras; ahora son
 * números tocables en una línea. El botón dice en cuántas fechas se guarda,
 * que es lo que hay que confirmar antes de apretar.
 */
export function PlanificarForm({
  action,
  profile,
  profesores,
  diasDisponibles,
  anio,
  mes,
  mesLabel,
  fechaInicial,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  profile: { id: string; rol: Rol };
  profesores: Pick<User, "id" | "nombre" | "rol" | "cargo">[];
  /** Días ISO (1=lunes...7=domingo) en los que el grupo tiene clase, según grupo_horarios. */
  diasDisponibles: number[];
  anio: number;
  mes: number;
  mesLabel: string;
  /**
   * Fecha que llega del atajo «Sin planificación» de la vista por día: abre el
   * formulario con ese día de la semana elegido y solo esa fecha marcada.
   */
  fechaInicial?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  const diaInicial = useMemo(() => {
    if (!fechaInicial) return diasDisponibles[0] ?? "";
    const [y, m, d] = fechaInicial.split("-").map(Number);
    const diaJs = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    const diaIso = diaJs === 0 ? 7 : diaJs;
    return diasDisponibles.includes(diaIso) ? diaIso : (diasDisponibles[0] ?? "");
  }, [fechaInicial, diasDisponibles]);

  const [diaIso, setDiaIso] = useState<number | "">(diaInicial);
  const [tipo, setTipo] = useState("Patín");

  const fechas = useMemo(
    () => (diaIso === "" ? [] : fechasDelMesPorDia(anio, mes, diaIso)),
    [anio, mes, diaIso]
  );

  // Con el atajo se marca solo la fecha que se vino a cargar; entrando de
  // frente, el mes entero, que es como se carga habitualmente.
  const [marcadas, setMarcadas] = useState<Set<string>>(
    () => new Set(fechaInicial ? [fechaInicial] : [])
  );
  const [tocoFechas, setTocoFechas] = useState(!!fechaInicial);
  const seleccionadas = tocoFechas ? fechas.filter((f) => marcadas.has(f)) : fechas;

  function cambiarDia(nuevo: number) {
    setDiaIso(nuevo);
    setTocoFechas(false);
    setMarcadas(new Set());
  }

  function alternarFecha(fecha: string) {
    const base = tocoFechas ? marcadas : new Set(fechas);
    const proximas = new Set(base);
    if (proximas.has(fecha)) proximas.delete(fecha);
    else proximas.add(fecha);
    setTocoFechas(true);
    setMarcadas(proximas);
  }

  function marcarTodas(todas: boolean) {
    setTocoFechas(true);
    setMarcadas(new Set(todas ? fechas : []));
  }

  const chipActivo = "border-primary-500 bg-primary-500 text-on-primary";
  const chipInactivo = "border-border text-text-muted hover:border-border-strong";

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="mes" value={`${anio}-${String(mes).padStart(2, "0")}`} />
      <input type="hidden" name="tipo" value={tipo} />
      {seleccionadas.map((fecha) => (
        <input key={fecha} type="hidden" name="fechas" value={fecha} />
      ))}

      <fieldset className="space-y-2">
        <legend className="text-label font-medium">Día de la semana</legend>
        <div className="flex flex-wrap gap-2">
          {diasDisponibles.map((d) => (
            <ChipOpcion key={d} activo={diaIso === d} onClick={() => cambiarDia(d)}>
              {nombreDia(d)}
            </ChipOpcion>
          ))}
        </div>
        <p className="text-sm text-text-subtle">Días que este grupo entrena.</p>
      </fieldset>

      {fechas.length > 0 && (
        <fieldset className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <legend className="text-label font-medium">Fechas de {mesLabel}</legend>
            <button
              type="button"
              onClick={() => marcarTodas(seleccionadas.length !== fechas.length)}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              {seleccionadas.length === fechas.length ? "Ninguna" : "Todas"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {fechas.map((fecha) => {
              const activa = seleccionadas.includes(fecha);
              return (
                <button
                  key={fecha}
                  type="button"
                  onClick={() => alternarFecha(fecha)}
                  aria-pressed={activa}
                  aria-label={`${Number(fecha.slice(8, 10))} de ${mesLabel}`}
                  className={`h-11 w-11 rounded-full border text-sm font-semibold tabular-nums transition-colors duration-[var(--duration-fast)] ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                    activa ? chipActivo : chipInactivo
                  }`}
                >
                  {Number(fecha.slice(8, 10))}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {profile.rol === "Admin" || profile.rol === "Head Coach" ? (
        <fieldset className="space-y-2">
          <legend className="text-label font-medium">Profesor/a a cargo</legend>
          <ChipsResponsables usuarios={profesores} name="profesores" />
        </fieldset>
      ) : (
        <p className="text-sm text-text-subtle">
          Esta planificación queda asignada a vos como profesor.
        </p>
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="planificacion" className="text-label font-medium">
            La planificación
          </label>
          <div className="flex gap-2">
            {(["Patín", "Preparación física"] as const).map((t) => (
              <ChipOpcion key={t} activo={tipo === t} onClick={() => setTipo(t)}>
                {t === "Preparación física" ? "Prep. física" : t}
              </ChipOpcion>
            ))}
          </div>
        </div>
        <textarea
          id="planificacion"
          name="planificacion"
          rows={8}
          required
          placeholder="Pegá acá lo que armaste. Entiende títulos, negritas y listas."
          className={INPUT_CLASS}
        />
      </div>

      {state.error && (
        <p role="alert" aria-live="assertive" className="text-sm text-error-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || seleccionadas.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-500 py-3 text-sm font-medium text-on-primary transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-primary-600 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {pending && <Spinner />}
        {pending
          ? "Guardando..."
          : seleccionadas.length === 0
            ? "Elegí al menos una fecha"
            : seleccionadas.length === 1
              ? "Guardar en 1 fecha"
              : `Guardar en ${seleccionadas.length} fechas`}
      </button>
    </form>
  );
}
