-- Sistema PSG, Fase 2 — F2 MOD 5: corrección de alcance.
--
-- Torneos no es un apartado de gestión administrativa: es información del
-- calendario del club que le interesa a todos, incluidas las alumnas con
-- login (rol Patinador/a). El SELECT pasa de estar acotado a
-- Admin/Head Coach/Secretaria a estar abierto a cualquier autenticado —
-- mismo criterio ya usado en `turnos_select_authenticated`. La escritura
-- (INSERT/UPDATE/DELETE, solo Admin y Head Coach) no cambia.

drop policy "torneos_select_admin_headcoach_secretaria" on public.torneos;

create policy "torneos_select_authenticated"
  on public.torneos for select
  to authenticated
  using (true);
