-- Módulo 3 (extensión 2026-08-22): roles Head Coach y Patinador + columna cargo
-- 1) Ampliar el CHECK de users.rol
-- 2) Agregar users.cargo (texto libre, sin efecto en permisos)
-- 3) Extender RLS:
--    - Head Coach: mismos permisos que Profesor sobre lo propio, más SELECT
--      de tareas/asignados/comentarios de Profesor, Empleado y Patinador.
--    - Patinador: mismos permisos que Empleado.

-- =========================================================
-- 1) Rol: ampliar el CHECK constraint
-- =========================================================
alter table public.users drop constraint users_rol_check;
alter table public.users add constraint users_rol_check
  check (rol in ('Admin', 'Profesor', 'Empleado', 'Head Coach', 'Patinador'));

-- =========================================================
-- 2) Columna cargo (descriptiva, no afecta permisos)
-- =========================================================
alter table public.users add column cargo text;

-- =========================================================
-- 3) Helper: ¿la tarea es visible para un Head Coach? (creador o algún
--    asignado tiene rol Profesor/Empleado/Patinador). Mismo patrón que
--    usuario_asignado_a_tarea: security definer para evitar recursión.
-- =========================================================
create or replace function public.tarea_visible_para_head_coach(p_tarea_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.tareas t
    left join public.users creador on creador.id = t.created_by
    where t.id = p_tarea_id
      and (
        creador.rol in ('Profesor', 'Empleado', 'Patinador')
        or exists (
          select 1
          from public.tarea_asignados ta
          join public.users u on u.id = ta.usuario_id
          where ta.tarea_id = t.id
            and u.rol in ('Profesor', 'Empleado', 'Patinador')
        )
      )
  );
$$;

-- =========================================================
-- tareas_select: sumar rama de lectura para Head Coach
-- =========================================================
drop policy "tareas_select" on public.tareas;

create policy "tareas_select"
  on public.tareas for select
  to authenticated
  using (
    public.current_user_rol() = 'Admin'
    or created_by = auth.uid()
    or public.usuario_asignado_a_tarea(tareas.id, auth.uid())
    or (
      public.current_user_rol() = 'Head Coach'
      and public.tarea_visible_para_head_coach(tareas.id)
    )
  );

-- =========================================================
-- tareas_insert: Head Coach puede crear (como Profesor)
-- =========================================================
drop policy "tareas_insert" on public.tareas;

create policy "tareas_insert"
  on public.tareas for insert
  to authenticated
  with check (
    public.current_user_rol() in ('Admin', 'Profesor', 'Head Coach')
    and created_by = auth.uid()
  );

-- =========================================================
-- tareas_update_admin_profesor -> renombrada, Head Coach entra en la
-- misma rama que Profesor (lo que creó o donde está asignado)
-- =========================================================
drop policy "tareas_update_admin_profesor" on public.tareas;

create policy "tareas_update_admin_profesor_headcoach"
  on public.tareas for update
  to authenticated
  using (
    public.current_user_rol() = 'Admin'
    or (
      public.current_user_rol() in ('Profesor', 'Head Coach')
      and (
        created_by = auth.uid()
        or public.usuario_asignado_a_tarea(tareas.id, auth.uid())
      )
    )
  )
  with check (
    public.current_user_rol() = 'Admin'
    or (
      public.current_user_rol() in ('Profesor', 'Head Coach')
      and (
        created_by = auth.uid()
        or public.usuario_asignado_a_tarea(tareas.id, auth.uid())
      )
    )
  );

-- =========================================================
-- tareas_update_empleado -> renombrada, sumar Patinador
-- =========================================================
drop policy "tareas_update_empleado" on public.tareas;

create policy "tareas_update_empleado_patinador"
  on public.tareas for update
  to authenticated
  using (
    public.current_user_rol() in ('Empleado', 'Patinador')
    and public.usuario_asignado_a_tarea(tareas.id, auth.uid())
  )
  with check (
    public.current_user_rol() in ('Empleado', 'Patinador')
    and public.usuario_asignado_a_tarea(tareas.id, auth.uid())
  );

-- =========================================================
-- Trigger anti-escalado: sumar Patinador (CREATE OR REPLACE, mismo
-- nombre de función y trigger, no hace falta recrear el trigger)
-- =========================================================
create or replace function public.check_tarea_update_empleado()
returns trigger as $$
begin
  if public.current_user_rol() in ('Empleado', 'Patinador') then
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

-- =========================================================
-- tareas_delete: Head Coach borra lo que creó (como Profesor)
-- =========================================================
drop policy "tareas_delete" on public.tareas;

create policy "tareas_delete"
  on public.tareas for delete
  to authenticated
  using (
    public.current_user_rol() = 'Admin'
    or (public.current_user_rol() in ('Profesor', 'Head Coach') and created_by = auth.uid())
  );

-- =========================================================
-- tarea_asignados_select: sumar rama Head Coach (mismo criterio que
-- tareas_select, duplicado inline como ya hacía el original)
-- =========================================================
drop policy "tarea_asignados_select" on public.tarea_asignados;

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
        or (
          public.current_user_rol() = 'Head Coach'
          and public.tarea_visible_para_head_coach(t.id)
        )
      )
    )
  );

-- =========================================================
-- tarea_asignados_insert / tarea_asignados_delete: sumar Head Coach.
-- Necesario para que pueda editar responsables de SU propia tarea vía
-- tareas/actions.ts (editarTarea borra e inserta en tarea_asignados
-- directamente, no pasa por tareas.update).
-- =========================================================
drop policy "tarea_asignados_insert" on public.tarea_asignados;

create policy "tarea_asignados_insert"
  on public.tarea_asignados for insert
  to authenticated
  with check (
    public.current_user_rol() = 'Admin'
    or (
      public.current_user_rol() in ('Profesor', 'Head Coach')
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

drop policy "tarea_asignados_delete" on public.tarea_asignados;

create policy "tarea_asignados_delete"
  on public.tarea_asignados for delete
  to authenticated
  using (
    public.current_user_rol() = 'Admin'
    or (
      public.current_user_rol() in ('Profesor', 'Head Coach')
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

-- =========================================================
-- tarea_comentarios_select: sumar rama Head Coach
-- =========================================================
drop policy "tarea_comentarios_select" on public.tarea_comentarios;

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
        or (
          public.current_user_rol() = 'Head Coach'
          and public.tarea_visible_para_head_coach(t.id)
        )
      )
    )
  );

-- Nota: tarea_comentarios_insert NO se toca. Head Coach solo comenta en
-- lo propio (creador/asignado), lo cual ya cubre la policy existente sin
-- cambios porque no se le da alta de comentario en tareas ajenas (el
-- pedido dice "más lectura", no "más comentarios").

-- =========================================================
-- turnos_insert: Head Coach crea su propio turno (como Profesor)
-- =========================================================
drop policy "turnos_insert" on public.turnos;

create policy "turnos_insert"
  on public.turnos for insert
  to authenticated
  with check (
    public.current_user_rol() = 'Admin'
    or (public.current_user_rol() in ('Profesor', 'Head Coach') and profesor_id = auth.uid())
  );

-- =========================================================
-- turnos_update: Head Coach edita su propio turno (como Profesor)
-- =========================================================
drop policy "turnos_update" on public.turnos;

create policy "turnos_update"
  on public.turnos for update
  to authenticated
  using (
    public.current_user_rol() = 'Admin'
    or (public.current_user_rol() in ('Profesor', 'Head Coach') and profesor_id = auth.uid())
  )
  with check (
    public.current_user_rol() = 'Admin'
    or (public.current_user_rol() in ('Profesor', 'Head Coach') and profesor_id = auth.uid())
  );

-- Nota: turnos_select ya es "using (true)" para cualquier autenticado ->
-- Head Coach y Patinador ya tienen lectura total, sin cambios.
-- Nota: turnos_delete_admin y tarea_comentarios_delete_admin no cambian
-- (Admin-only, ni Profesor ni Head Coach borran).
