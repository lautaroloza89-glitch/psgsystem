-- Sistema PSG, Correcciones pre-UI — Bloque 2: crear el rol Secretaria.
--
-- 'Secretaria' ya vivía en el tipo `Rol` del front y en las policies de
-- alumnas/contactos/pagos/pagos_metodos/asistencia/torneos, pero no era un
-- valor posible de `users.rol`: Dai estaba cargada como Admin "como parche",
-- así que ninguna restricción del rol existía de verdad y veía la recaudación
-- del club, que es justo lo que no debe ver.

alter table public.users drop constraint users_rol_check;
alter table public.users add constraint users_rol_check
  check (rol in ('Admin', 'Profesor', 'Empleado', 'Head Coach', 'Patinador', 'Secretaria'));

-- =========================================================
-- Planificaciones: solo lectura para Secretaria.
--
-- La policy de escritura se había adelantado a incluirla (F2 MOD 1, cuando el
-- alcance del rol todavía no estaba definido). El alcance cerrado le da ver el
-- calendario pero no planificar ni cargar objetivos del mes, así que se
-- corrige acá, en la misma migración que crea el rol, antes de que el rol
-- empiece a aplicar. La lectura sigue abierta a cualquier autenticado.
-- `turnos` no hace falta tocarla: sus policies de escritura ya son
-- Admin/Head Coach/Profesor, sin Secretaria.
-- =========================================================
drop policy "grupo_objetivos_mes_write" on public.grupo_objetivos_mes;

create policy "grupo_objetivos_mes_write"
  on public.grupo_objetivos_mes for all
  to authenticated
  using (public.current_user_rol() in ('Admin', 'Head Coach', 'Profesor'))
  with check (public.current_user_rol() in ('Admin', 'Head Coach', 'Profesor'));

-- =========================================================
-- Tareas.
--
-- Ninguna policy de tareas nombraba a 'Secretaria' — se habían escrito antes
-- de que el rol existiera y nadie las revisó al definir el alcance. Sin esto,
-- al migrar a Dai de Admin a Secretaria perdía el módulo entero en silencio:
-- pasaba a ver solo las tareas propias o asignadas y no podía crear ninguna.
--
-- Lectura: Secretaria ve todas, igual que Admin. "Como Head Coach" y "ve
-- todas" no son lo mismo (un Head Coach no ve las tareas entre Admin y Head
-- Coach que no involucran a ninguna Profesora/Empleada/Patinadora) y acá
-- manda "ve todas": probado con rollback, con el criterio de Head Coach la
-- única tarea cargada hoy le desaparecía del listado.
--
-- Escritura de estructura (crear, asignar, borrar): como Head Coach, o sea
-- solo sobre las propias o asignadas.
-- =========================================================
drop policy "tareas_select" on public.tareas;

create policy "tareas_select"
  on public.tareas for select
  to authenticated
  using (
    public.current_user_rol() in ('Admin', 'Secretaria')
    or created_by = auth.uid()
    or public.usuario_asignado_a_tarea(id, auth.uid())
    or (
      public.current_user_rol() = 'Head Coach'
      and public.tarea_visible_para_head_coach(id)
    )
  );

drop policy "tareas_insert" on public.tareas;

create policy "tareas_insert"
  on public.tareas for insert
  to authenticated
  with check (
    public.current_user_rol() in ('Admin', 'Profesor', 'Head Coach', 'Secretaria')
    and created_by = auth.uid()
  );

-- Head Coach y Secretaria pasan a poder actualizar cualquier tarea que ven, no
-- solo las propias o asignadas: el punto 1.1 de las correcciones define que
-- cambian el estado de cualquier tarea, y hasta ahora la RLS lo rechazaba sin
-- error (la pantalla decía que había andado y no se guardaba nada). Profesor
-- sigue limitado a las propias o asignadas.
--
-- La RLS es por fila, no por columna: a nivel base esto también les permite
-- editar título/fechas de una tarea ajena. La aplicación se lo sigue
-- bloqueando en `puedeEditarTarea` (src/lib/permisos.ts) — decisión tomada a
-- ojos abiertos, club de 10 personas.
drop policy "tareas_update_admin_profesor_headcoach" on public.tareas;

create policy "tareas_update_admin_profesor_headcoach"
  on public.tareas for update
  to authenticated
  using (
    public.current_user_rol() in ('Admin', 'Secretaria')
    or (
      public.current_user_rol() = 'Profesor'
      and (created_by = auth.uid() or public.usuario_asignado_a_tarea(id, auth.uid()))
    )
    or (
      public.current_user_rol() = 'Head Coach'
      and (
        created_by = auth.uid()
        or public.usuario_asignado_a_tarea(id, auth.uid())
        or public.tarea_visible_para_head_coach(id)
      )
    )
  )
  with check (
    public.current_user_rol() in ('Admin', 'Secretaria')
    or (
      public.current_user_rol() = 'Profesor'
      and (created_by = auth.uid() or public.usuario_asignado_a_tarea(id, auth.uid()))
    )
    or (
      public.current_user_rol() = 'Head Coach'
      and (
        created_by = auth.uid()
        or public.usuario_asignado_a_tarea(id, auth.uid())
        or public.tarea_visible_para_head_coach(id)
      )
    )
  );

drop policy "tareas_delete" on public.tareas;

create policy "tareas_delete"
  on public.tareas for delete
  to authenticated
  using (
    public.current_user_rol() = 'Admin'
    or (
      public.current_user_rol() in ('Profesor', 'Head Coach', 'Secretaria')
      and created_by = auth.uid()
    )
  );

drop policy "tarea_asignados_select" on public.tarea_asignados;

create policy "tarea_asignados_select"
  on public.tarea_asignados for select
  to authenticated
  using (
    exists (
      select 1 from public.tareas t
      where t.id = tarea_asignados.tarea_id
        and (
          public.current_user_rol() in ('Admin', 'Secretaria')
          or t.created_by = auth.uid()
          or public.usuario_asignado_a_tarea(t.id, auth.uid())
          or (
            public.current_user_rol() = 'Head Coach'
            and public.tarea_visible_para_head_coach(t.id)
          )
        )
    )
  );

drop policy "tarea_asignados_insert" on public.tarea_asignados;

create policy "tarea_asignados_insert"
  on public.tarea_asignados for insert
  to authenticated
  with check (
    public.current_user_rol() = 'Admin'
    or (
      public.current_user_rol() in ('Profesor', 'Head Coach', 'Secretaria')
      and exists (
        select 1 from public.tareas t
        where t.id = tarea_asignados.tarea_id
          and (t.created_by = auth.uid() or public.usuario_asignado_a_tarea(t.id, auth.uid()))
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
      public.current_user_rol() in ('Profesor', 'Head Coach', 'Secretaria')
      and exists (
        select 1 from public.tareas t
        where t.id = tarea_asignados.tarea_id
          and (t.created_by = auth.uid() or public.usuario_asignado_a_tarea(t.id, auth.uid()))
      )
    )
  );

drop policy "tarea_comentarios_select" on public.tarea_comentarios;

create policy "tarea_comentarios_select"
  on public.tarea_comentarios for select
  to authenticated
  using (
    exists (
      select 1 from public.tareas t
      where t.id = tarea_comentarios.tarea_id
        and (
          public.current_user_rol() in ('Admin', 'Secretaria')
          or t.created_by = auth.uid()
          or public.usuario_asignado_a_tarea(t.id, auth.uid())
          or (
            public.current_user_rol() = 'Head Coach'
            and public.tarea_visible_para_head_coach(t.id)
          )
        )
    )
  );

drop policy "tarea_comentarios_insert" on public.tarea_comentarios;

create policy "tarea_comentarios_insert"
  on public.tarea_comentarios for insert
  to authenticated
  with check (
    autor_id = auth.uid()
    and exists (
      select 1 from public.tareas t
      where t.id = tarea_comentarios.tarea_id
        and (
          public.current_user_rol() in ('Admin', 'Secretaria')
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
-- El parche: Dai deja de ser Admin.
--
-- `cargo` pasa de 'Secretaria' a 'Administración': el rol ya dice qué es, y
-- el cargo es el texto descriptivo que diferencia personas dentro de un mismo
-- rol (ver docs/roles-actualizacion.md).
-- =========================================================
update public.users
set rol = 'Secretaria', cargo = 'Administración'
where email = 'dai@gmail.com';
