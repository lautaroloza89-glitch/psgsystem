-- Fase 2 — F2 MOD 3: Pagos y cuotas.
-- Un pago es un evento de cobro, no un mes cerrado: una alumna puede tener
-- varias filas de `pagos` con el mismo `mes_correspondiente` (pago parcial de
-- un contacto, completado después por otro). "¿Está pagado el mes?" se
-- calcula sumando (F2 MOD 3, puntos 2 y 6), no vive en una sola fila.

-- =========================================================
-- pagos
-- =========================================================
create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  -- restrict (no cascade/set null): borrar una alumna no debe destruir en
  -- silencio su historial de pagos, mismo criterio que alumnas.grupo_id.
  alumna_id uuid not null references public.alumnas (id) on delete restrict,
  -- quién pagó; precargado en el formulario con el pagador principal de la
  -- alumna, editable, puede quedar null (F2 MOD 3, punto 1).
  contacto_id uuid references public.contactos (id) on delete set null,
  -- primer día del mes (ej. 2026-09-01), mismo criterio que grupo_objetivos_mes.mes.
  mes_correspondiente date not null,
  -- snapshot de grupos.cuota_mensual al momento de este pago, no referencia
  -- viva: la cuota cambia 1-2 veces al año y sin snapshot un cambio
  -- desordenaría el histórico de pagos anteriores.
  monto_cuota numeric(10, 2) not null check (monto_cuota > 0),
  -- cargado explícitamente por la Secretaria (checkbox "Incluir recargo"),
  -- no se aplica fijo porque se perdona a veces.
  monto_recargo numeric(10, 2) not null default 0 check (monto_recargo >= 0),
  -- lo efectivamente pagado en este evento — puede ser parcial, sin bloqueo.
  monto numeric(10, 2) not null check (monto > 0),
  estado text not null default 'pendiente_verificar'
    check (estado in ('pendiente_verificar', 'verificado')),
  -- not null: protege el registro de auditoría (restrict en vez de set null).
  registrado_por uuid not null references public.users (id) on delete restrict,
  verificado_por uuid references public.users (id) on delete set null,
  verificado_en timestamptz,
  created_at timestamptz not null default now(),
  constraint pagos_mes_correspondiente_dia1 check (extract(day from mes_correspondiente) = 1),
  constraint pagos_verificacion_consistente check (
    (estado = 'verificado' and verificado_por is not null and verificado_en is not null)
    or (estado = 'pendiente_verificar' and verificado_por is null and verificado_en is null)
  )
);

create index pagos_alumna_id_idx on public.pagos (alumna_id);
create index pagos_mes_correspondiente_idx on public.pagos (mes_correspondiente);
create index pagos_estado_idx on public.pagos (estado);

alter table public.pagos enable row level security;

-- =========================================================
-- pagos_metodos
-- La suma de estas filas tiene que dar exacto pagos.monto — validado en el
-- formulario/server action (mismo criterio que el resto de la app: sin
-- trigger de validación cruzada en base para esto).
-- =========================================================
create table public.pagos_metodos (
  id uuid primary key default gen_random_uuid(),
  pago_id uuid not null references public.pagos (id) on delete cascade,
  metodo text not null check (metodo in ('efectivo', 'transferencia', 'debito')),
  monto numeric(10, 2) not null check (monto > 0)
);

create index pagos_metodos_pago_id_idx on public.pagos_metodos (pago_id);

alter table public.pagos_metodos enable row level security;

-- =========================================================
-- RLS: lectura y escritura para Admin, Head Coach y Secretaria — mismo
-- patrón que alumnas/contactos (Fase 2, Sesión 1). 'Secretaria' todavía no
-- es un valor posible de users.rol (Dai sigue en 'Admin' como parche
-- temporal, ver PROGRESS.md); la policy queda escrita contra el rol
-- correcto para que funcione sola cuando ese parche se resuelva, sin otra
-- migración.
-- =========================================================
create policy "pagos_admin_headcoach_secretaria"
  on public.pagos for all
  to authenticated
  using (public.current_user_rol() in ('Admin', 'Head Coach', 'Secretaria'))
  with check (public.current_user_rol() in ('Admin', 'Head Coach', 'Secretaria'));

create policy "pagos_metodos_admin_headcoach_secretaria"
  on public.pagos_metodos for all
  to authenticated
  using (public.current_user_rol() in ('Admin', 'Head Coach', 'Secretaria'))
  with check (public.current_user_rol() in ('Admin', 'Head Coach', 'Secretaria'));
