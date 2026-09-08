-- Sistema PSG — corrección al Bloque 5: Secretaria también arma la convocatoria.
--
-- El Bloque 5 dejó a Secretaria pudiendo *actualizar* una convocatoria (estado
-- de inscripción, pago) pero no crearla ni borrarla, lo que la dejaba a mitad
-- de camino: podía marcar quién pagó, pero dependía de Admin o Head Coach para
-- armar la lista. En la práctica es ella quien la arma, así que en toda la
-- tabla `torneo_participantes` queda igual que Admin y Head Coach: convocar,
-- editar y desconvocar.
--
-- El SELECT no se toca: sigue incluyendo a Profesor, que ve la convocatoria
-- pero no la modifica — por eso las escrituras siguen en tres policies
-- separadas y no en una sola `for all`.
--
-- Se aplica en `main` antes de abrir la rama de UI: el rediseño no cambia
-- esquema, así que este ajuste tiene que existir antes de que se escriban las
-- pantallas de participación en torneos (módulo 8 del rediseño).

drop policy "torneo_participantes_insert_admin_headcoach" on public.torneo_participantes;

create policy "torneo_participantes_insert_admin_headcoach_secretaria"
  on public.torneo_participantes for insert
  to authenticated
  with check (public.current_user_rol() in ('Admin', 'Head Coach', 'Secretaria'));

drop policy "torneo_participantes_delete_admin_headcoach" on public.torneo_participantes;

create policy "torneo_participantes_delete_admin_headcoach_secretaria"
  on public.torneo_participantes for delete
  to authenticated
  using (public.current_user_rol() in ('Admin', 'Head Coach', 'Secretaria'));
