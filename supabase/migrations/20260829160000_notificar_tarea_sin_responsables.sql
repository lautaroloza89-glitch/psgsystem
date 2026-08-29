-- Auditoría Fase B (sesión 3/3), punto 3: al borrar un usuario, tarea_asignados
-- hace cascade sobre sus asignaciones y una tarea puede quedar con 0
-- responsables sin ningún aviso. Se suma un trigger que notifica a los Admins
-- cuando eso pasa — cubre el borrado de usuario y cualquier otro delete sobre
-- tarea_asignados que deje una tarea sin responsables (ej. reasignación manual).
create or replace function public.notificar_tarea_sin_responsables()
returns trigger as $$
declare
  v_titulo text;
begin
  -- Si la tarea también fue borrada (cascade desde tareas), este trigger se
  -- dispara igual sobre sus propias filas de tarea_asignados: no notificar
  -- sobre una tarea que ya no existe.
  select titulo into v_titulo from public.tareas where id = old.tarea_id;

  if v_titulo is not null
     and not exists (
       select 1 from public.tarea_asignados where tarea_id = old.tarea_id
     )
  then
    insert into public.notificaciones (usuario_id, tipo, mensaje, tarea_id)
    select id, 'tarea_sin_responsables', 'Quedó sin responsables: ' || v_titulo, old.tarea_id
    from public.users
    where rol = 'Admin';
  end if;

  return old;
end;
$$ language plpgsql security definer set search_path = public;

create trigger tarea_asignados_notificar_sin_responsables
  after delete on public.tarea_asignados
  for each row execute function public.notificar_tarea_sin_responsables();
