-- Fase 2, Sesión 1: modelo de datos base (grupos, grupo_horarios, alumnas, contactos)
-- Groundwork del que dependen los módulos de Fase 2. Sin UI en esta sesión.

-- =========================================================
-- grupos: reemplaza el texto libre de "Grupo/nivel" de turnos.grupo_nivel.
-- cuota_mensual guarda solo el valor vigente, sin historial (el historial de
-- lo cobrado queda en los pagos de F2 MOD 3).
-- =========================================================
create table public.grupos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  cuota_mensual numeric(10, 2) not null check (cuota_mensual > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger grupos_set_updated_at
  before update on public.grupos
  for each row execute function public.set_updated_at();

alter table public.grupos enable row level security;

-- =========================================================
-- grupo_horarios: una fila por bloque horario. Tabla aparte (no campos en
-- grupos) porque Jungla tiene dos bloques distintos.
--
-- dias: smallint[] con el día ISO (extract(isodow from fecha)): 1=lunes,
-- 2=martes, 3=miércoles, 4=jueves, 5=viernes, 6=sábado, 7=domingo. Elegido
-- en vez de texto libre para que sea consultable (filtrar por día en F2 MOD 4,
-- calcular fechas del mes por día de semana en F2 MOD 1) y en vez de un enum
-- nuevo porque el valor ISO ya matchea directo con extract(isodow from ...).
-- =========================================================
create table public.grupo_horarios (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  dias smallint[] not null,
  hora_inicio time not null,
  hora_fin time not null,
  created_at timestamptz not null default now(),
  constraint grupo_horarios_dias_validos check (
    cardinality(dias) > 0 and dias <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
  ),
  constraint grupo_horarios_horario_valido check (hora_fin > hora_inicio)
);

create index grupo_horarios_grupo_id_idx on public.grupo_horarios (grupo_id);
create index grupo_horarios_dias_idx on public.grupo_horarios using gin (dias);

alter table public.grupo_horarios enable row level security;

-- =========================================================
-- alumnas: datos puros, no usuarios del sistema (sin login, sin cuenta de
-- Auth). Sin relación con el rol "Patinador/a" de Fase 1 (entidades separadas
-- a propósito). Tabla queda vacía en esta sesión, se carga por import aparte.
-- =========================================================
create table public.alumnas (
  id uuid primary key default gen_random_uuid(),
  apellido text not null,
  nombre text not null,
  dni text not null unique,
  fecha_inscripcion date not null,
  estado text not null default 'activa' check (estado in ('activa', 'baja')),
  grupo_id uuid not null references public.grupos (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger alumnas_set_updated_at
  before update on public.alumnas
  for each row execute function public.set_updated_at();

-- Se busca y ordena por apellido (no por DNI).
create index alumnas_apellido_idx on public.alumnas (apellido);
create index alumnas_grupo_id_idx on public.alumnas (grupo_id);

alter table public.alumnas enable row level security;

-- =========================================================
-- contactos: relación uno a varios con alumnas (familias con uno, dos, o
-- tutores). Reemplaza campos fijos tipo "madre/padre".
-- es_pagador_principal solo precarga el contacto por default en un pago de
-- F2 MOD 3 (sin restricción de unicidad ni validación).
-- =========================================================
create table public.contactos (
  id uuid primary key default gen_random_uuid(),
  alumna_id uuid not null references public.alumnas (id) on delete cascade,
  nombre text not null,
  telefono text not null,
  relacion text not null,
  es_pagador_principal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger contactos_set_updated_at
  before update on public.contactos
  for each row execute function public.set_updated_at();

create index contactos_alumna_id_idx on public.contactos (alumna_id);

alter table public.contactos enable row level security;

-- =========================================================
-- RLS
-- =========================================================

-- ---------- grupos / grupo_horarios ----------
-- Lectura para todos los roles autenticados. Escritura para Admin y Head Coach.
create policy "grupos_select_authenticated"
  on public.grupos for select
  to authenticated
  using (true);

create policy "grupos_insert_admin_headcoach"
  on public.grupos for insert
  to authenticated
  with check (public.current_user_rol() in ('Admin', 'Head Coach'));

create policy "grupos_update_admin_headcoach"
  on public.grupos for update
  to authenticated
  using (public.current_user_rol() in ('Admin', 'Head Coach'))
  with check (public.current_user_rol() in ('Admin', 'Head Coach'));

create policy "grupos_delete_admin_headcoach"
  on public.grupos for delete
  to authenticated
  using (public.current_user_rol() in ('Admin', 'Head Coach'));

create policy "grupo_horarios_select_authenticated"
  on public.grupo_horarios for select
  to authenticated
  using (true);

create policy "grupo_horarios_insert_admin_headcoach"
  on public.grupo_horarios for insert
  to authenticated
  with check (public.current_user_rol() in ('Admin', 'Head Coach'));

create policy "grupo_horarios_update_admin_headcoach"
  on public.grupo_horarios for update
  to authenticated
  using (public.current_user_rol() in ('Admin', 'Head Coach'))
  with check (public.current_user_rol() in ('Admin', 'Head Coach'));

create policy "grupo_horarios_delete_admin_headcoach"
  on public.grupo_horarios for delete
  to authenticated
  using (public.current_user_rol() in ('Admin', 'Head Coach'));

-- ---------- alumnas / contactos ----------
-- Lectura y escritura para Admin, Head Coach y Secretaria. Ningún otro rol
-- accede (ni siquiera lectura). 'Secretaria' todavía no existe como valor
-- posible de users.rol (Dai sigue en 'Admin' como parche temporal, ver
-- PROGRESS.md) — se deja la policy ya escrita contra el rol correcto para
-- que funcione sola en cuanto ese parche se resuelva aparte, sin otra
-- migración. Mientras tanto el acceso real de Dai pasa por la rama 'Admin'.
create policy "alumnas_admin_headcoach_secretaria"
  on public.alumnas for all
  to authenticated
  using (public.current_user_rol() in ('Admin', 'Head Coach', 'Secretaria'))
  with check (public.current_user_rol() in ('Admin', 'Head Coach', 'Secretaria'));

create policy "contactos_admin_headcoach_secretaria"
  on public.contactos for all
  to authenticated
  using (public.current_user_rol() in ('Admin', 'Head Coach', 'Secretaria'))
  with check (public.current_user_rol() in ('Admin', 'Head Coach', 'Secretaria'));

-- =========================================================
-- Datos semilla: grupos y grupo_horarios
-- Cuotas vigentes desde septiembre 2026, según comunicado oficial del club.
-- =========================================================
insert into public.grupos (nombre, cuota_mensual) values
  ('Nivel inicial', 45000),
  ('Equipo de competencia infantil', 60000),
  ('Equipo de competencia (Jungla)', 85000),
  ('Equipo avanzado', 90000),
  ('Recreativo adultas', 50000);

insert into public.grupo_horarios (grupo_id, dias, hora_inicio, hora_fin)
select id, array[2, 4]::smallint[], '19:00', '20:00'
from public.grupos where nombre = 'Nivel inicial';

insert into public.grupo_horarios (grupo_id, dias, hora_inicio, hora_fin)
select id, array[1, 3, 5]::smallint[], '18:30', '20:00'
from public.grupos where nombre = 'Equipo de competencia infantil';

insert into public.grupo_horarios (grupo_id, dias, hora_inicio, hora_fin)
select id, array[2, 4]::smallint[], '19:20', '22:00'
from public.grupos where nombre = 'Equipo de competencia (Jungla)';

insert into public.grupo_horarios (grupo_id, dias, hora_inicio, hora_fin)
select id, array[6]::smallint[], '09:00', '12:00'
from public.grupos where nombre = 'Equipo de competencia (Jungla)';

insert into public.grupo_horarios (grupo_id, dias, hora_inicio, hora_fin)
select id, array[1, 3, 5]::smallint[], '19:30', '22:00'
from public.grupos where nombre = 'Equipo avanzado';

insert into public.grupo_horarios (grupo_id, dias, hora_inicio, hora_fin)
select id, array[1, 5]::smallint[], '21:15', '23:00'
from public.grupos where nombre = 'Recreativo adultas';
