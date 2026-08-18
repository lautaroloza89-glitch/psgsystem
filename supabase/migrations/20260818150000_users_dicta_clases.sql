-- Módulo 5: Horarios/Turnos
-- Distingue, entre los usuarios con rol Admin, cuáles dictan clases (para
-- poder ofrecerlos como "profesor" de un turno además de los que tienen
-- rol Profesor). No es un rol de permisos nuevo -- no toca RLS -- es solo
-- un dato para el dropdown de profesor del formulario de turnos.
alter table public.users
  add column dicta_clases boolean not null default false;

comment on column public.users.dicta_clases is
  'true si el usuario dicta clases (se ofrece como profesor de un turno), independiente de su rol de permisos';

-- Todo Profesor dicta clases por definición.
update public.users
  set dicta_clases = true
  where rol = 'Profesor';

-- Head Coach / dueña (Admin que también dicta clases).
update public.users
  set dicta_clases = true
  where email = 'patinsaintgermain@gmail.com';
