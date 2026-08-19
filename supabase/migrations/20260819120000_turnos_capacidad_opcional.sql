-- Corrección mobile (2026-08-19): se saca el campo "Capacidad" del formulario
-- de turnos. La columna se mantiene (no se borra), pero deja de ser
-- obligatoria: los turnos nuevos no llevan un valor inventado solo para
-- satisfacer el not null.
alter table public.turnos
  alter column capacidad drop not null;
