-- Auditoría Fase B, sesión 2/3 (docs/auditoria-fase-b-2-db-aditivo.md,
-- hallazgo #3): notificaciones no tenía ninguna policy de delete. Confirmado
-- con el usuario: no era intencional, se agrega para Admin únicamente
-- (moderación puntual, mismo criterio que tarea_comentarios_delete_admin).
create policy "notificaciones_delete_admin"
  on public.notificaciones for delete
  to authenticated
  using (public.current_user_rol() = 'Admin');
