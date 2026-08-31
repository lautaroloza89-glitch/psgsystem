-- Sistema PSG, Fase 2 — F2 MOD 1: Planificaciones
-- Luciana arma las planificaciones en ChatGPT (títulos por día, negritas,
-- listas, emojis, tablas) y hoy las pega como parche en los comentarios de
-- una clase. Este módulo le da el lugar correcto.
--
-- Modelo de datos confirmado con el usuario antes de escribir esto: la
-- planificación NO es una tabla separada — turnos ya es una fila por fecha
-- puntual (Módulo 2, Fase 1), así que planificacion/tipo se agregan directo
-- ahí. Guardar una planificación con checkboxes de fechas (F2 MOD 1, carga)
-- crea o actualiza filas de turnos, sin tabla nueva para eso.

-- =========================================================
-- 1) turnos: campo de planificación (texto libre, render markdown en el
--    frontend) y tipo (Patín / Preparación física, para no mezclar las
--    planificaciones de patín y de física del mismo grupo en la
--    navegación grupo → mes → planificaciones).
-- =========================================================
alter table public.turnos
  add column planificacion text,
  add column tipo text not null default 'Patín';

alter table public.turnos
  add constraint turnos_tipo_valido check (tipo in ('Patín', 'Preparación física'));

comment on column public.turnos.planificacion is
  'Contenido de la clase (markdown), pegado por Luciana desde ChatGPT. F2 MOD 1.';
comment on column public.turnos.tipo is
  'Patín (default) o Preparación física — separa las planificaciones del mismo grupo. F2 MOD 1.';

-- Usado por la navegación grupo → mes → planificaciones (F2 MOD 1) para
-- listar rápido las filas de un grupo en un rango de fechas.
create index turnos_grupo_id_fecha_idx on public.turnos (grupo_id, fecha);

-- Sin cambios de RLS: turnos_insert/turnos_update (Groundwork 3) ya
-- permiten Admin/Head Coach/Profesor (no Empleado/Patinador), que es
-- exactamente el criterio de "quién carga planificaciones" de este módulo.

-- =========================================================
-- 2) grupo_objetivos_mes: "Objetivo del mes" por grupo, un campo de texto
--    libre (markdown) por combinación grupo+mes. Vive en la vista
--    grupo → mes, no por clase puntual.
--
--    mes: se guarda siempre como el día 1 del mes (convención, permite
--    unique(grupo_id, mes) y comparar/ordenar directo por fecha).
-- =========================================================
create table public.grupo_objetivos_mes (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  mes date not null,
  objetivo text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grupo_objetivos_mes_mes_dia1 check (extract(day from mes) = 1),
  unique (grupo_id, mes)
);

create trigger grupo_objetivos_mes_set_updated_at
  before update on public.grupo_objetivos_mes
  for each row execute function public.set_updated_at();

alter table public.grupo_objetivos_mes enable row level security;

-- Lectura abierta a cualquier autenticado, mismo criterio que grupos/turnos.
create policy "grupo_objetivos_mes_select_authenticated"
  on public.grupo_objetivos_mes for select
  to authenticated
  using (true);

-- Escritura: Admin, Head Coach y Secretaria (control total del módulo) más
-- Profesor (las profesoras cargan planificaciones y objetivos). Sin
-- Empleado/Patinador. 'Secretaria' todavía no es un valor posible de
-- users.rol (Dai sigue en 'Admin' como parche temporal, ver PROGRESS.md) —
-- misma convención que alumnas/contactos (Fase 2, Sesión 1): la policy
-- queda escrita contra el rol correcto para que funcione sola en cuanto
-- ese parche se resuelva, sin otra migración.
create policy "grupo_objetivos_mes_write"
  on public.grupo_objetivos_mes for all
  to authenticated
  using (public.current_user_rol() in ('Admin', 'Head Coach', 'Profesor', 'Secretaria'))
  with check (public.current_user_rol() in ('Admin', 'Head Coach', 'Profesor', 'Secretaria'));
