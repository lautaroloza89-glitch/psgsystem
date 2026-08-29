-- Auditoría Fase B (sesión 3/3), punto 2: notificaciones.tarea_id hacía cascade
-- desde tareas, perdiendo avisos históricos de otros usuarios (leídos o no)
-- como efecto colateral de que alguien borre la tarea. Se cambia a set null,
-- mismo patrón que ya usan tareas.created_by y turnos.profesor_id.

alter table public.notificaciones
  drop constraint notificaciones_tarea_id_fkey;

alter table public.notificaciones
  add constraint notificaciones_tarea_id_fkey
  foreign key (tarea_id) references public.tareas(id) on delete set null;
