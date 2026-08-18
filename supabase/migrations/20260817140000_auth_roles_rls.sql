-- Módulo 3: Auth + roles
-- 1) Trigger que crea la fila en public.users cuando se crea un usuario en auth.users
-- 2) Función helper para leer el rol del usuario autenticado sin recursión de RLS
-- 3) Políticas RLS para las 5 tablas (Admin / Profesor / Empleado)

-- =========================================================
-- 1) Alta automática del perfil al crear el usuario en Auth
-- =========================================================
-- No hay auto-registro público: el Admin crea la cuenta desde el dashboard de
-- Supabase Auth (o vía Management API), idealmente pasando user_metadata con
-- "nombre" y "rol". Si no se pasa metadata, el perfil se crea con rol
-- 'Empleado' (mínimo privilegio) y el Admin lo corrige después a mano.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, nombre, rol)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'rol', 'Empleado')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- 2) Helper: rol del usuario autenticado (security definer,
--    evita la recursión de RLS al consultar public.users desde
--    las políticas de las otras tablas)
-- =========================================================
create or replace function public.current_user_rol()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select rol from public.users where id = auth.uid();
$$;

-- Helper adicional: chequea si un usuario está asignado a una tarea.
-- security definer para evitar que las políticas de tarea_asignados se
-- consulten a sí mismas (Postgres detecta eso como recursión infinita,
-- aunque la subconsulta esté acotada).
create or replace function public.usuario_asignado_a_tarea(p_tarea_id uuid, p_usuario_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.tarea_asignados
    where tarea_id = p_tarea_id and usuario_id = p_usuario_id
  );
$$;

-- =========================================================
-- 3) Políticas RLS
-- =========================================================

-- ---------- users ----------
-- Cualquier usuario autenticado puede leer los perfiles (nombre/rol de
-- otros usuarios se necesita para mostrar responsables de tareas/turnos).
create policy "users_select_authenticated"
  on public.users for select
  to authenticated
  using (true);

-- Solo Admin edita o borra perfiles (rol, nombre, etc.).
create policy "users_update_admin"
  on public.users for update
  to authenticated
  using (public.current_user_rol() = 'Admin')
  with check (public.current_user_rol() = 'Admin');

create policy "users_delete_admin"
  on public.users for delete
  to authenticated
  using (public.current_user_rol() = 'Admin');

-- No hay política de INSERT: la fila la crea el trigger handle_new_user
-- (security definer), no la aplicación.

-- ---------- tareas ----------
-- Admin ve todo. Profesor/Empleado ven las tareas que crearon o donde
-- están asignados.
create policy "tareas_select"
  on public.tareas for select
  to authenticated
  using (
    public.current_user_rol() = 'Admin'
    or created_by = auth.uid()
    or public.usuario_asignado_a_tarea(tareas.id, auth.uid())
  );

-- Solo Admin y Profesor crean tareas, y quedan como creadores de la suya.
create policy "tareas_insert"
  on public.tareas for insert
  to authenticated
  with check (
    public.current_user_rol() in ('Admin', 'Profesor')
    and created_by = auth.uid()
  );

-- Admin edita cualquier tarea. Profesor edita las que creó o donde está
-- asignado (estructura, fechas, asignados incluidos).
create policy "tareas_update_admin_profesor"
  on public.tareas for update
  to authenticated
  using (
    public.current_user_rol() = 'Admin'
    or (
      public.current_user_rol() = 'Profesor'
      and (
        created_by = auth.uid()
        or public.usuario_asignado_a_tarea(tareas.id, auth.uid())
      )
    )
  )
  with check (
    public.current_user_rol() = 'Admin'
    or (
      public.current_user_rol() = 'Profesor'
      and (
        created_by = auth.uid()
        or public.usuario_asignado_a_tarea(tareas.id, auth.uid())
      )
    )
  );

-- Empleado solo puede tocar su propia tarea asignada (el trigger de abajo
-- restringe qué columnas puede cambiar: solo estado).
create policy "tareas_update_empleado"
  on public.tareas for update
  to authenticated
  using (
    public.current_user_rol() = 'Empleado'
    and public.usuario_asignado_a_tarea(tareas.id, auth.uid())
  )
  with check (
    public.current_user_rol() = 'Empleado'
    and public.usuario_asignado_a_tarea(tareas.id, auth.uid())
  );

-- Admin borra cualquier tarea. Profesor borra las que creó.
create policy "tareas_delete"
  on public.tareas for delete
  to authenticated
  using (
    public.current_user_rol() = 'Admin'
    or (public.current_user_rol() = 'Profesor' and created_by = auth.uid())
  );

-- Enforcement a nivel DB: un Empleado no puede cambiar título, descripción,
-- fechas ni el creador de la tarea, solo el estado. RLS no restringe columnas
-- por sí sola, así que se valida en un trigger.
create or replace function public.check_tarea_update_empleado()
returns trigger as $$
begin
  if public.current_user_rol() = 'Empleado' then
    if new.titulo is distinct from old.titulo
      or new.descripcion is distinct from old.descripcion
      or new.fecha_inicio is distinct from old.fecha_inicio
      or new.fecha_vencimiento is distinct from old.fecha_vencimiento
      or new.created_by is distinct from old.created_by
    then
      raise exception 'Empleado solo puede modificar el estado de la tarea';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger tareas_restrict_empleado_update
  before update on public.tareas
  for each row execute function public.check_tarea_update_empleado();

-- ---------- tarea_asignados ----------
-- Visible para quien puede ver la tarea (mismo criterio que tareas_select).
create policy "tarea_asignados_select"
  on public.tarea_asignados for select
  to authenticated
  using (
    exists (
      select 1 from public.tareas t
      where t.id = tarea_asignados.tarea_id
      and (
        public.current_user_rol() = 'Admin'
        or t.created_by = auth.uid()
        or public.usuario_asignado_a_tarea(t.id, auth.uid())
      )
    )
  );

-- Solo Admin, o el Profesor dueño/asignado de la tarea, gestiona asignados.
-- Empleado no puede tocar esta tabla (no edita "asignados").
create policy "tarea_asignados_insert"
  on public.tarea_asignados for insert
  to authenticated
  with check (
    public.current_user_rol() = 'Admin'
    or (
      public.current_user_rol() = 'Profesor'
      and exists (
        select 1 from public.tareas t
        where t.id = tarea_asignados.tarea_id
        and (
          t.created_by = auth.uid()
          or public.usuario_asignado_a_tarea(t.id, auth.uid())
        )
      )
    )
  );

create policy "tarea_asignados_delete"
  on public.tarea_asignados for delete
  to authenticated
  using (
    public.current_user_rol() = 'Admin'
    or (
      public.current_user_rol() = 'Profesor'
      and exists (
        select 1 from public.tareas t
        where t.id = tarea_asignados.tarea_id
        and (
          t.created_by = auth.uid()
          or public.usuario_asignado_a_tarea(t.id, auth.uid())
        )
      )
    )
  );

-- ---------- tarea_comentarios ----------
-- Visible para quien puede ver la tarea.
create policy "tarea_comentarios_select"
  on public.tarea_comentarios for select
  to authenticated
  using (
    exists (
      select 1 from public.tareas t
      where t.id = tarea_comentarios.tarea_id
      and (
        public.current_user_rol() = 'Admin'
        or t.created_by = auth.uid()
        or public.usuario_asignado_a_tarea(t.id, auth.uid())
      )
    )
  );

-- Cualquiera que pueda ver la tarea puede comentar (Empleado incluido),
-- siempre que quede como autor de su propio comentario.
create policy "tarea_comentarios_insert"
  on public.tarea_comentarios for insert
  to authenticated
  with check (
    autor_id = auth.uid()
    and exists (
      select 1 from public.tareas t
      where t.id = tarea_comentarios.tarea_id
      and (
        public.current_user_rol() = 'Admin'
        or t.created_by = auth.uid()
        or public.usuario_asignado_a_tarea(t.id, auth.uid())
      )
    )
  );

-- Los comentarios son historial: no se editan. Solo Admin puede borrar
-- (moderación puntual).
create policy "tarea_comentarios_delete_admin"
  on public.tarea_comentarios for delete
  to authenticated
  using (public.current_user_rol() = 'Admin');

-- ---------- turnos ----------
-- El horario es compartido: todos los autenticados ven todos los turnos.
create policy "turnos_select_authenticated"
  on public.turnos for select
  to authenticated
  using (true);

-- Admin crea cualquier turno. Profesor solo puede crearse turnos a sí mismo.
create policy "turnos_insert"
  on public.turnos for insert
  to authenticated
  with check (
    public.current_user_rol() = 'Admin'
    or (public.current_user_rol() = 'Profesor' and profesor_id = auth.uid())
  );

-- Admin edita cualquier turno. Profesor solo el suyo (incluye cancelarlo
-- vía estado = 'Cancelado'), y no puede reasignarlo a otro profesor_id.
create policy "turnos_update"
  on public.turnos for update
  to authenticated
  using (
    public.current_user_rol() = 'Admin'
    or (public.current_user_rol() = 'Profesor' and profesor_id = auth.uid())
  )
  with check (
    public.current_user_rol() = 'Admin'
    or (public.current_user_rol() = 'Profesor' and profesor_id = auth.uid())
  );

-- Solo Admin borra turnos (se prefiere cancelar vía estado para conservar
-- el historial, según el modelo de datos del Módulo 2).
create policy "turnos_delete_admin"
  on public.turnos for delete
  to authenticated
  using (public.current_user_rol() = 'Admin');
