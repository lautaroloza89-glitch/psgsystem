-- Fase 1.2 (Sesión 1): Notificaciones de Clases/Turnos — comentario nuevo
-- Extiende el mecanismo de notificaciones ya construido para Tareas
-- (Módulo 7) a Turnos, reutilizando la misma tabla `notificaciones` y la
-- misma campana (NotificacionesBell). Único disparador de esta sesión: no
-- hay "vencimiento" de turno, porque el horario de un grupo es fijo.
--
-- A diferencia de Tareas, Clases/Turnos no tenía ningún feature de
-- comentarios (ni tabla ni UI) — esta migración lo crea desde cero,
-- siguiendo el mismo patrón que `tarea_comentarios`.

-- =========================================================
-- 1) Tabla turno_comentarios
-- =========================================================
create table public.turno_comentarios (
  id uuid primary key default gen_random_uuid(),
  turno_id uuid not null references public.turnos(id) on delete cascade,
  autor_id uuid references public.users(id) on delete set null,
  comentario text not null,
  created_at timestamptz not null default now()
);

create index turno_comentarios_turno_id_idx
  on public.turno_comentarios (turno_id);

alter table public.turno_comentarios enable row level security;

-- El horario es compartido: cualquier autenticado que ve el turno
-- (turnos_select_authenticated, using (true)) también ve sus comentarios.
create policy "turno_comentarios_select"
  on public.turno_comentarios for select
  to authenticated
  using (true);

-- Mismo criterio de apertura: cualquier autenticado puede comentar,
-- quedando como autor de su propio comentario.
create policy "turno_comentarios_insert"
  on public.turno_comentarios for insert
  to authenticated
  with check (autor_id = auth.uid());

-- Comentarios como historial: no se editan. Solo Admin borra (moderación
-- puntual), mismo criterio que tarea_comentarios_delete_admin.
create policy "turno_comentarios_delete_admin"
  on public.turno_comentarios for delete
  to authenticated
  using (public.current_user_rol() = 'Admin');

-- =========================================================
-- 2) notificaciones: columna turno_id
-- =========================================================
-- Mismo patrón que tarea_id (on delete set null desde la auditoría Fase B,
-- 20260829150000): borrar un turno no debe destruir el historial de
-- notificaciones de otros usuarios.
alter table public.notificaciones
  add column turno_id uuid references public.turnos(id) on delete set null;

-- =========================================================
-- 3) Trigger: comentario nuevo en un turno
-- =========================================================
-- Destinatario: solo el profesor asignado al turno (turnos.profesor_id es
-- una relación 1:1, no M:N como tarea_asignados), excluyendo al autor del
-- comentario. Si el turno no tiene profesor asignado, no hay destinatario.
create or replace function public.notificar_comentario_turno_nuevo()
returns trigger as $$
declare
  v_grupo_nivel text;
  v_profesor_id uuid;
  v_autor_nombre text;
begin
  select grupo_nivel, profesor_id into v_grupo_nivel, v_profesor_id
  from public.turnos where id = new.turno_id;

  if v_profesor_id is not null and v_profesor_id is distinct from new.autor_id then
    select nombre into v_autor_nombre from public.users where id = new.autor_id;

    insert into public.notificaciones (usuario_id, tipo, mensaje, turno_id)
    values (
      v_profesor_id,
      'comentario_turno_nuevo',
      coalesce(v_autor_nombre, 'Alguien') || ' comentó en el turno: ' || coalesce(v_grupo_nivel, 'una clase'),
      new.turno_id
    );
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger turno_comentarios_notificar
  after insert on public.turno_comentarios
  for each row execute function public.notificar_comentario_turno_nuevo();

-- Nota: el trigger de push (notificaciones_push, Módulo 7 - Sesión 4) se
-- engancha directo a `notificaciones` y no distingue por `tipo`, así que
-- este tipo nuevo ('comentario_turno_nuevo') ya queda cubierto por push
-- sin ningún cambio adicional.
