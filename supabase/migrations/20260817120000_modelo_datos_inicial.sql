-- Módulo 2: Modelo de datos inicial
-- Tablas: users, tareas, tarea_asignados, tarea_comentarios, turnos

-- Función auxiliar para mantener updated_at al día en cada UPDATE
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =========================================================
-- users: perfil de cada usuario, ligado 1 a 1 con auth.users
-- =========================================================
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  nombre text not null,
  rol text not null check (rol in ('Admin', 'Profesor', 'Empleado')),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- =========================================================
-- tareas: tareas de trabajo (un solo nivel, sin jerarquía)
-- =========================================================
create table public.tareas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  estado text not null default 'Pendiente' check (estado in ('Pendiente', 'En progreso', 'Completada')),
  fecha_inicio date,
  fecha_vencimiento date,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tareas_set_updated_at
  before update on public.tareas
  for each row execute function public.set_updated_at();

alter table public.tareas enable row level security;

-- =========================================================
-- tarea_asignados: relación muchos a muchos entre tareas y usuarios
-- =========================================================
create table public.tarea_asignados (
  tarea_id uuid not null references public.tareas (id) on delete cascade,
  usuario_id uuid not null references public.users (id) on delete cascade,
  asignado_en timestamptz not null default now(),
  primary key (tarea_id, usuario_id)
);

alter table public.tarea_asignados enable row level security;

-- =========================================================
-- tarea_comentarios: historial de comentarios cortos por tarea
-- (ej. el comentario que deja el Empleado al cambiar el estado)
-- =========================================================
create table public.tarea_comentarios (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references public.tareas (id) on delete cascade,
  autor_id uuid references public.users (id) on delete set null,
  comentario text not null,
  created_at timestamptz not null default now()
);

alter table public.tarea_comentarios enable row level security;

-- =========================================================
-- turnos: horarios de la escuela, un registro por fecha puntual
-- (no recurrente por fila; se puede cancelar un día puntual sin borrarlo)
-- =========================================================
create table public.turnos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  hora_inicio time not null,
  hora_fin time not null,
  grupo_nivel text not null,
  capacidad integer not null check (capacidad > 0),
  profesor_id uuid references public.users (id) on delete set null,
  estado text not null default 'Activo' check (estado in ('Activo', 'Cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint turnos_horario_valido check (hora_fin > hora_inicio)
);

create trigger turnos_set_updated_at
  before update on public.turnos
  for each row execute function public.set_updated_at();

alter table public.turnos enable row level security;

-- Nota: RLS queda habilitada en todas las tablas sin políticas todavía.
-- Esto bloquea el acceso vía la anon key hasta que el Módulo 3 (Auth + roles)
-- defina las políticas por rol. service_role sigue teniendo acceso completo.
