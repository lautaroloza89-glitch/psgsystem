-- Módulo 7 (Sesión 2): Notificaciones — trigger de "comentario nuevo"
-- Reutiliza la tabla notificaciones y el patrón del trigger de la sesión 1
-- (notificar_tarea_asignada, ver 20260825150000_notificaciones.sql).

-- =========================================================
-- Trigger: comentario nuevo
-- =========================================================
-- Dispara en cada INSERT real a tarea_comentarios.
-- Destinatarios: responsables asignados (tarea_asignados) + creador de la
-- tarea (tareas.created_by), unión sin duplicados, menos el autor del
-- comentario (así el creador se entera aunque haya delegado la tarea y no
-- esté entre los asignados).
create or replace function public.notificar_comentario_nuevo()
returns trigger as $$
declare
  v_titulo text;
  v_autor_nombre text;
begin
  select titulo into v_titulo from public.tareas where id = new.tarea_id;
  select nombre into v_autor_nombre from public.users where id = new.autor_id;

  insert into public.notificaciones (usuario_id, tipo, mensaje, tarea_id)
  select
    destinatario_id,
    'comentario_nuevo',
    coalesce(v_autor_nombre, 'Alguien') || ' comentó en: ' || coalesce(v_titulo, 'una tarea'),
    new.tarea_id
  from (
    select usuario_id as destinatario_id from public.tarea_asignados where tarea_id = new.tarea_id
    union
    select created_by as destinatario_id from public.tareas where id = new.tarea_id
  ) destinatarios
  where destinatario_id is not null
    and destinatario_id is distinct from new.autor_id;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger tarea_comentarios_notificar
  after insert on public.tarea_comentarios
  for each row execute function public.notificar_comentario_nuevo();
