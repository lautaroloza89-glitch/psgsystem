-- Sistema PSG — Head Coach queda igual que Admin y Secretaria en Tareas.
--
-- Hasta acá, Head Coach veía y editaba las tareas propias, las que tenía
-- asignadas, y las de Profesor/Empleado/Patinador (vía
-- `tarea_visible_para_head_coach`). Lo que quedaba afuera era una tarea entre
-- Admin y Secretaria únicamente: no la veía ni la podía tocar.
--
-- Decisión del usuario (2026-09-08): Head Coach ve y edita **cualquier** tarea.
-- Es la dueña del club; el recorte venía de la Fase 1, cuando el rol se pensó
-- como "Profesor con más alcance sobre horarios".
--
-- La lectura se amplía junto con la escritura a propósito: no se puede editar
-- lo que no aparece en ningún listado, así que abrir solo el UPDATE dejaría el
-- permiso a mitad de camino.
--
-- `tareas_delete` **no se toca**: borrar sigue siendo de Admin, y de quien la
-- creó. Es la acción destructiva del módulo y nadie pidió ampliarla.

-- =========================================================
-- Lectura
-- =========================================================
drop policy "tareas_select" on public.tareas;

create policy "tareas_select"
  on public.tareas for select
  to authenticated
  using (
    public.current_user_rol() in ('Admin', 'Secretaria', 'Head Coach')
    or created_by = auth.uid()
    or public.usuario_asignado_a_tarea(id, auth.uid())
  );

-- =========================================================
-- Edición
--
-- Se renombra la policy: el nombre viejo
-- (`tareas_update_admin_profesor_headcoach`) ya no describe quién entra.
-- =========================================================
drop policy "tareas_update_admin_profesor_headcoach" on public.tareas;

create policy "tareas_update_gestion_y_profesor"
  on public.tareas for update
  to authenticated
  using (
    public.current_user_rol() in ('Admin', 'Secretaria', 'Head Coach')
    or (
      public.current_user_rol() = 'Profesor'
      and (created_by = auth.uid() or public.usuario_asignado_a_tarea(id, auth.uid()))
    )
  )
  with check (
    public.current_user_rol() in ('Admin', 'Secretaria', 'Head Coach')
    or (
      public.current_user_rol() = 'Profesor'
      and (created_by = auth.uid() or public.usuario_asignado_a_tarea(id, auth.uid()))
    )
  );

-- `public.tarea_visible_para_head_coach(uuid)` queda sin uso en las policies de
-- `tareas`. No se dropea en esta migración: es `SECURITY DEFINER` y conviene
-- confirmar primero que no la use nada más (notificaciones, triggers) antes de
-- borrarla. Queda anotado en docs/pendientes.md.
