-- Fase 2, F2 MOD 2: ajustes de esquema en alumnas/contactos, decididos con el
-- usuario antes de construir la UI (pregunta de alto impacto, ver PROGRESS.md).
--
-- Groundwork 1 (20260831120000) dejó dni NOT NULL UNIQUE, grupo_id NOT NULL y
-- contactos.relacion NOT NULL, probado a propósito en esa sesión. Este módulo
-- necesita lo contrario para poder tolerar el import futuro del listado real
-- de Luciana (~150 filas, incompletas y con posibles DNI repetidos): dni y
-- grupo_id opcionales en base (grupo sigue obligatorio a nivel de formulario
-- para el alta manual), relacion de contacto opcional. La tabla alumnas sigue
-- vacía (0 filas) en esta sesión, así que el ALTER no rompe datos existentes.

-- ---------- alumnas.dni: NOT NULL UNIQUE -> NULL + índice único parcial ----------
alter table public.alumnas
  drop constraint alumnas_dni_key;

alter table public.alumnas
  alter column dni drop not null;

create unique index alumnas_dni_unique_idx
  on public.alumnas (dni)
  where dni is not null;

-- ---------- alumnas.grupo_id: NOT NULL -> NULL (obligatorio solo en el form) ----------
alter table public.alumnas
  alter column grupo_id drop not null;

-- ---------- alumnas.fecha_inscripcion: default current_date ----------
alter table public.alumnas
  alter column fecha_inscripcion set default current_date;

-- ---------- contactos.relacion: NOT NULL -> NULL (texto libre, opcional) ----------
alter table public.contactos
  alter column relacion drop not null;
