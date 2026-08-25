-- Módulo 7 (Sesión 1): Notificaciones — tabla base + trigger de "tarea asignada"
-- Alcance de esta sesión: solo este disparador. Comentarios nuevos, tareas por
-- vencer/vencidas y push quedan para sesiones futuras del mismo módulo.

-- =========================================================
-- 1) Tabla notificaciones
-- =========================================================
create table public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.users(id) on delete cascade,
  tipo text not null,
  mensaje text not null,
  tarea_id uuid references public.tareas(id) on delete cascade,
  leida boolean not null default false,
  creado_en timestamptz not null default now()
);

create index notificaciones_usuario_id_creado_en_idx
  on public.notificaciones (usuario_id, creado_en desc);

alter table public.notificaciones enable row level security;

-- Cada usuario ve y marca como leídas solo sus propias notificaciones.
create policy "notificaciones_select_propias"
  on public.notificaciones for select
  to authenticated
  using (usuario_id = auth.uid());

create policy "notificaciones_update_propias"
  on public.notificaciones for update
  to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

-- No hay política de INSERT: las filas las crea el trigger de abajo
-- (security definer), no la aplicación — mismo patrón que public.users
-- (ver handle_new_user en 20260817140000_auth_roles_rls.sql).

-- =========================================================
-- 2) Trigger: tarea asignada
-- =========================================================
-- Dispara en cada INSERT real a tarea_asignados, no en updates de tareas:
-- como una tarea puede tener varios responsables (relación M:N), cada fila
-- nueva de tarea_asignados es una asignación individual a notificar.
--
-- tareas/actions.ts (editarTarea) fue corregido en esta misma sesión para
-- insertar solo los responsables realmente nuevos al reasignar (antes
-- borraba y reinsertaba todos en cada edición) — así este trigger no
-- reenvía notificación a quien ya estaba asignado.
create or replace function public.notificar_tarea_asignada()
returns trigger as $$
declare
  v_titulo text;
begin
  -- No notificar autoasignación. auth.uid() puede ser null si la fila la
  -- inserta un proceso sin sesión (ej. service_role) — en ese caso sí se
  -- notifica, "is distinct from" trata null como distinto de cualquier uuid.
  if new.usuario_id is distinct from auth.uid() then
    select titulo into v_titulo from public.tareas where id = new.tarea_id;

    insert into public.notificaciones (usuario_id, tipo, mensaje, tarea_id)
    values (
      new.usuario_id,
      'tarea_asignada',
      'Te asignaron: ' || coalesce(v_titulo, 'una tarea'),
      new.tarea_id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger tarea_asignados_notificar
  after insert on public.tarea_asignados
  for each row execute function public.notificar_tarea_asignada();

-- =========================================================
-- 3) Realtime
-- =========================================================
alter publication supabase_realtime add table public.notificaciones;
