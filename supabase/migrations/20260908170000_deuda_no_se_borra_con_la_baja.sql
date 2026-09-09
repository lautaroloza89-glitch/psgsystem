-- Sistema PSG — La baja de una alumna deja de cancelar su deuda.
--
-- Los dos cambios que pide el modelo del módulo 5 del rediseño (Pagos). Se
-- aplican en `main` y no en `nueva-ui` porque las dos ramas comparten la misma
-- base: el esquema se toca de un solo lado.
--
-- El problema: `calcularDeudorasDelMes` filtra `estado = 'activa'`, así que en
-- el momento en que se da de baja a una alumna desaparece de Deudoras con la
-- deuda intacta. Es la baja funcionando como borrado de deuda, sin que nadie lo
-- haya decidido.
--
-- Sacar el filtro no alcanza: una alumna que se fue en marzo seguiría generando
-- cuota todos los meses para siempre. Hacen falta las dos piezas de abajo.

-- =========================================================
-- 1. Desde cuándo dejó de deber.
--
-- `estado` dice «está de baja» pero no «desde cuándo», y sin eso no se puede
-- saber hasta qué mes se le cobra. Con esta columna, el cálculo incluye a las
-- alumnas de baja solo hasta el mes de su baja inclusive.
--
-- Nullable a propósito, y con dos lecturas distintas según el estado:
--   * alumna activa    → null es lo normal (no está de baja).
--   * alumna de baja    → null significa «baja vieja, sin fecha registrada»: no
--     genera cuota de ningún mes. Es el lado seguro (no inventar deuda de un
--     dato que nadie cargó) y hoy no afecta a nadie: las 158 alumnas están
--     activas, no hay ninguna baja en la base.
--
-- No se agrega trigger que la complete sola al pasar a 'baja': la fecha real de
-- baja no siempre es el día en que alguien la carga en el sistema, así que la
-- elige quien da la baja desde el formulario.
-- =========================================================
alter table public.alumnas add column fecha_baja date null;

comment on column public.alumnas.fecha_baja is
  'Fecha desde la que la alumna dejó de deber cuota. Solo tiene sentido con estado = ''baja''; null en una alumna de baja significa baja vieja sin fecha, y no genera cuota de ningún mes.';

-- =========================================================
-- 2. Cerrar el mes de una alumna sin plata de por medio.
--
-- Hoy el saldo solo baja con un pago verificado, así que perdonar una deuda
-- obliga a inventar un pago falso — y eso ensucia la recaudación del mes. Esta
-- tabla la consulta el cálculo de deudoras igual que los pagos, pero no toca
-- `pagos`, así que la recaudación no se altera.
--
-- Una fila por alumna y mes (unique): saldar dos veces el mismo mes no tiene
-- sentido, y para deshacerlo se borra la fila.
--
-- `motivo` es obligatorio y sin longitud mínima en base (la valida el
-- formulario): en tres meses nadie se va a acordar por qué se saldó un mes sin
-- cobrarlo. Por eso también «eliminar de la lista» y «marcar como saldada» son
-- la misma acción y no dos, como pide el modelo.
-- =========================================================
create table public.deudas_saldadas (
  id uuid primary key default gen_random_uuid(),
  -- `restrict` como el resto del historial de plata (`pagos.alumna_id`): que
  -- borrar una alumna no destruya en silencio por qué se le perdonó un mes.
  alumna_id uuid not null references public.alumnas(id) on delete restrict,
  -- Siempre el día 1, misma convención que `pagos.mes_correspondiente`.
  mes_correspondiente date not null,
  motivo text not null,
  saldada_por uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),

  constraint deudas_saldadas_mes_dia_1 check (extract(day from mes_correspondiente) = 1),
  constraint deudas_saldadas_motivo_no_vacio check (btrim(motivo) <> ''),
  constraint deudas_saldadas_alumna_mes_unica unique (alumna_id, mes_correspondiente)
);

-- La lectura del reporte es siempre por mes, igual que la de `pagos`.
create index deudas_saldadas_mes_idx on public.deudas_saldadas (mes_correspondiente);

alter table public.deudas_saldadas enable row level security;

-- Mismo trío que `pagos`/`pagos_metodos`, política única `for all`: saldar una
-- deuda es una operación del módulo Pagos.
create policy deudas_saldadas_admin_headcoach_secretaria on public.deudas_saldadas
  for all
  using (current_user_rol() = any (array['Admin', 'Head Coach', 'Secretaria']))
  with check (current_user_rol() = any (array['Admin', 'Head Coach', 'Secretaria']));
