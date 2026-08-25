-- Extiende el permiso de Head Coach sobre turnos: de "solo lo propio" (igual
-- que Profesor) a control total, igual que Admin. Decisión de producto
-- 2026-08-25: Head Coach es quien crea la mayor parte de las planificaciones
-- de clases y necesita poder asignarlas a cualquier profesor, no solo a sí
-- misma. Profesor mantiene el alcance anterior (solo sus propios turnos).
-- Ver docs/roles-actualizacion.md.

drop policy "turnos_insert" on public.turnos;

create policy "turnos_insert"
  on public.turnos for insert
  to authenticated
  with check (
    public.current_user_rol() in ('Admin', 'Head Coach')
    or (public.current_user_rol() = 'Profesor' and profesor_id = auth.uid())
  );

drop policy "turnos_update" on public.turnos;

create policy "turnos_update"
  on public.turnos for update
  to authenticated
  using (
    public.current_user_rol() in ('Admin', 'Head Coach')
    or (public.current_user_rol() = 'Profesor' and profesor_id = auth.uid())
  )
  with check (
    public.current_user_rol() in ('Admin', 'Head Coach')
    or (public.current_user_rol() = 'Profesor' and profesor_id = auth.uid())
  );

-- Nota: turnos_delete_admin no cambia (sigue Admin-only, no se pidió borrado
-- para Head Coach). turnos_select_authenticated ya es lectura total, sin cambios.
