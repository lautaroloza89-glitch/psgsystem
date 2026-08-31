-- Sistema PSG, Fase 2 — Groundwork 3: arreglos a nivel clase
-- (1) Notificación de asignación de clase (hueco de Fase 1.2: el único
--     disparador scopeado entonces fue "comentario nuevo", nunca se sumó
--     "te asignaron esta clase").
-- (2) turnos.profesor_id (1:1) pasa a turno_profesores (M:N): hay clases
--     con dos profesoras a la vez (Caro/Dai entre semana, Male/Estefi los
--     sábados). Se migran los datos existentes y se dropea la columna
--     vieja, siguiendo el mismo patrón M:N que tarea_asignados en vez de
--     dejar un campo redundante sin uso.
--
-- Fuera de alcance (F2 MOD 1, sesión siguiente): todo lo de planificación
-- de contenido de la clase.

-- =========================================================
-- 1) Tabla turno_profesores (M:N)
-- =========================================================
create table public.turno_profesores (
  turno_id uuid not null references public.turnos(id) on delete cascade,
  profesor_id uuid not null references public.users(id) on delete cascade,
  primary key (turno_id, profesor_id)
);

create index turno_profesores_profesor_id_idx
  on public.turno_profesores (profesor_id);

alter table public.turno_profesores enable row level security;

-- Mismo criterio de lectura que turnos: el horario es compartido.
create policy "turno_profesores_select"
  on public.turno_profesores for select
  to authenticated
  using (true);

-- Admin/Head Coach asignan cualquier combinación de profesores. Un
-- Profesor solo puede autoasignarse (mismo alcance que ya tenía sobre
-- turnos.profesor_id antes de esta migración).
create policy "turno_profesores_insert"
  on public.turno_profesores for insert
  to authenticated
  with check (
    public.current_user_rol() in ('Admin', 'Head Coach')
    or (public.current_user_rol() = 'Profesor' and profesor_id = auth.uid())
  );

create policy "turno_profesores_delete"
  on public.turno_profesores for delete
  to authenticated
  using (
    public.current_user_rol() in ('Admin', 'Head Coach')
    or (public.current_user_rol() = 'Profesor' and profesor_id = auth.uid())
  );

-- =========================================================
-- 2) Migrar datos existentes de turnos.profesor_id
-- =========================================================
insert into public.turno_profesores (turno_id, profesor_id)
select id, profesor_id from public.turnos where profesor_id is not null;

-- =========================================================
-- 3) turnos_insert / turnos_update ya no pueden condicionar por
--    profesor_id (se va a dropear en el paso 4). El control de "quién
--    puede asignar a quién" pasa a vivir en turno_profesores (paso 1);
--    acá el criterio para Profesor pasa de "profesor_id = auth.uid()" a
--    "está en turno_profesores de este turno" (para update) — para
--    insert no hay turno_id todavía, así que se permite crear la fila y
--    la autoasignación real ocurre después vía turno_profesores.
-- =========================================================
drop policy "turnos_insert" on public.turnos;

create policy "turnos_insert"
  on public.turnos for insert
  to authenticated
  with check (public.current_user_rol() in ('Admin', 'Head Coach', 'Profesor'));

drop policy "turnos_update" on public.turnos;

create policy "turnos_update"
  on public.turnos for update
  to authenticated
  using (
    public.current_user_rol() in ('Admin', 'Head Coach')
    or (
      public.current_user_rol() = 'Profesor'
      and exists (
        select 1 from public.turno_profesores tp
        where tp.turno_id = turnos.id and tp.profesor_id = auth.uid()
      )
    )
  )
  with check (
    public.current_user_rol() in ('Admin', 'Head Coach')
    or (
      public.current_user_rol() = 'Profesor'
      and exists (
        select 1 from public.turno_profesores tp
        where tp.turno_id = turnos.id and tp.profesor_id = auth.uid()
      )
    )
  );

-- =========================================================
-- 4) Dropear turnos.profesor_id (el índice turnos_profesor_id_idx se
--    elimina en cascada junto con la columna).
-- =========================================================
alter table public.turnos drop column profesor_id;

-- =========================================================
-- 5) Trigger: asignación de clase (hueco #1)
-- =========================================================
-- Dispara en cada INSERT real a turno_profesores, no en updates de
-- turnos: al ser M:N, cada fila nueva es una asignación individual a
-- notificar (mismo patrón que notificar_tarea_asignada sobre
-- tarea_asignados). horarios/actions.ts hace diff de altas/bajas al
-- editar, así que este trigger no reenvía a quien ya estaba asignado.
create or replace function public.notificar_turno_asignado()
returns trigger as $$
declare
  v_grupo_nombre text;
  v_fecha date;
begin
  -- No notificar autoasignación (auth.uid() puede ser null si la fila la
  -- inserta un proceso sin sesión; "is distinct from" trata null como
  -- distinto de cualquier uuid, así que en ese caso sí se notifica).
  if new.profesor_id is distinct from auth.uid() then
    select coalesce(g.nombre, t.grupo_legacy), t.fecha
      into v_grupo_nombre, v_fecha
    from public.turnos t
    left join public.grupos g on g.id = t.grupo_id
    where t.id = new.turno_id;

    insert into public.notificaciones (usuario_id, tipo, mensaje, turno_id)
    values (
      new.profesor_id,
      'turno_asignado',
      'Te asignaron la clase: ' || coalesce(v_grupo_nombre, 'una clase')
        || ' (' || to_char(v_fecha, 'DD/MM') || ')',
      new.turno_id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger turno_profesores_notificar
  after insert on public.turno_profesores
  for each row execute function public.notificar_turno_asignado();

-- =========================================================
-- 6) notificar_comentario_turno_nuevo: de "el único profesor_id" a
--    "todos los profesores en turno_profesores" (mismo cambio de
--    cardinalidad que el resto de esta migración).
-- =========================================================
create or replace function public.notificar_comentario_turno_nuevo()
returns trigger as $$
declare
  v_grupo_nombre text;
  v_autor_nombre text;
begin
  select coalesce(g.nombre, t.grupo_legacy) into v_grupo_nombre
  from public.turnos t
  left join public.grupos g on g.id = t.grupo_id
  where t.id = new.turno_id;

  select nombre into v_autor_nombre from public.users where id = new.autor_id;

  insert into public.notificaciones (usuario_id, tipo, mensaje, turno_id)
  select
    tp.profesor_id,
    'comentario_turno_nuevo',
    coalesce(v_autor_nombre, 'Alguien') || ' comentó en la clase: '
      || coalesce(v_grupo_nombre, 'una clase'),
    new.turno_id
  from public.turno_profesores tp
  where tp.turno_id = new.turno_id
    and tp.profesor_id is distinct from new.autor_id;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- El trigger turno_comentarios_notificar ya apunta a esta función
-- (create or replace la actualiza in place, no hace falta recrearlo).

-- Nota: el trigger de push (notificaciones_push, Módulo 7 — Sesión 4) no
-- distingue por `tipo`, así que 'turno_asignado' ya queda cubierto por
-- push sin ningún cambio adicional.
