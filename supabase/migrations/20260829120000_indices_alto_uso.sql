-- Auditoría Fase B, sesión 2/3 (docs/auditoria-fase-b-2-db-aditivo.md,
-- hallazgo #2): índices sobre columnas de alto uso para filtros/joins.
-- Aditivo, no cambia comportamiento. Con ≤10 usuarios el impacto de
-- performance hoy es bajo, se adelanta antes de que crezca el volumen.
--
-- CONCURRENTLY evita bloquear la tabla mientras se construye el índice,
-- pero no puede correr dentro de una transacción explícita: cada
-- statement se aplicó como una llamada separada a la Management API.
create index concurrently if not exists tareas_estado_idx
  on public.tareas (estado);

create index concurrently if not exists tareas_fecha_vencimiento_idx
  on public.tareas (fecha_vencimiento);

create index concurrently if not exists tareas_created_by_idx
  on public.tareas (created_by);

create index concurrently if not exists turnos_profesor_id_idx
  on public.turnos (profesor_id);

create index concurrently if not exists turnos_fecha_idx
  on public.turnos (fecha);

create index concurrently if not exists tarea_comentarios_tarea_id_idx
  on public.tarea_comentarios (tarea_id);
