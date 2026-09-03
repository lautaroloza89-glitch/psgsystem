-- Sistema PSG, Fase 2 — F2 MOD 5: Torneos.
--
-- Registro de torneos/exhibiciones/eventos del calendario del club. Alcance
-- de esta sesión: solo el registro (qué se corre y cuándo). Qué alumnas
-- participan y el control de inscripción paga quedan fuera a propósito, ver
-- PROGRESS.md.

create table public.torneos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  -- 5 de las 7 cosas que hoy se cargan a mano son torneos de competencia,
  -- pero 2 no (Exhibición de Cierre sin otros clubes ni inscripción, "último
  -- entreno" solo marca de calendario) — un campo evita que sigan viviendo
  -- como parche en Tareas.
  tipo text not null default 'torneo' check (tipo in ('torneo', 'exhibicion', 'evento')),
  -- Vacío para lo que es en el club (ej. "último entreno").
  lugar text null,
  fecha_inicio date not null,
  -- Para eventos de un solo día, igual a fecha_inicio (el form la autocompleta).
  fecha_fin date not null,
  notas text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint torneos_fecha_fin_valida check (fecha_fin >= fecha_inicio)
);

-- Listado cronológico y filtro por año: ambos ordenan/filtran por fecha_inicio.
create index torneos_fecha_inicio_idx on public.torneos (fecha_inicio);

create trigger torneos_set_updated_at
  before update on public.torneos
  for each row execute function public.set_updated_at();

alter table public.torneos enable row level security;

-- =========================================================
-- RLS: primera tabla del proyecto con lectura y escritura diferenciadas.
-- Ver el listado: Admin, Head Coach, Secretaria (mismo criterio que
-- alumnas/pagos/asistencia). Crear/editar/borrar: solo Admin y Head Coach —
-- Secretaria ve pero no toca. 'Secretaria' todavía no es un valor posible de
-- users.rol (Dai sigue en 'Admin' como parche temporal, ver PROGRESS.md); la
-- policy de select queda escrita contra el rol correcto para que funcione
-- sola cuando ese parche se resuelva, sin otra migración.
-- =========================================================
create policy "torneos_select_admin_headcoach_secretaria"
  on public.torneos for select
  to authenticated
  using (public.current_user_rol() in ('Admin', 'Head Coach', 'Secretaria'));

create policy "torneos_insert_admin_headcoach"
  on public.torneos for insert
  to authenticated
  with check (public.current_user_rol() in ('Admin', 'Head Coach'));

create policy "torneos_update_admin_headcoach"
  on public.torneos for update
  to authenticated
  using (public.current_user_rol() in ('Admin', 'Head Coach'))
  with check (public.current_user_rol() in ('Admin', 'Head Coach'));

create policy "torneos_delete_admin_headcoach"
  on public.torneos for delete
  to authenticated
  using (public.current_user_rol() in ('Admin', 'Head Coach'));
