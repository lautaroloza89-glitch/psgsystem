-- Sistema PSG — Correcciones post-rediseño: una sola fila por grupo, fecha y tipo.
--
-- Un grupo entrena una vez por fecha, y en esa franja puede haber Patín,
-- Preparación física, o las dos: son dos filas de `turnos` con distinto `tipo`
-- que comparten grupo, fecha y horario. Lo que nunca tiene sentido es que haya
-- **dos de Patín** o **dos de física** para la misma fecha del mismo grupo.
--
-- Nada lo impedía. El 2026-09-09 (`Física y Patín dejan de pisarse en la misma
-- fecha`) se arregló `upsertPlanificacionFecha`, que buscaba la fila existente
-- por grupo+fecha sin mirar `tipo` y por eso la física pisaba la planificación
-- de patín. Pero ese arreglo vive en la aplicación: la base seguía aceptando el
-- duplicado por cualquier otro camino (`editarTurno` moviendo una clase a una
-- fecha que ya tiene la suya, un insert manual, un script).
--
-- Y el duplicado no es visible: las pantallas que arman un mapa por fecha
-- muestran una de las dos filas y esconden la otra en silencio. Fue exactamente
-- el bug de la vista del grupo, corregido en el rediseño. Esta constraint cierra
-- el agujero abajo, donde corresponde.
--
-- Verificado antes de aplicar: 0 duplicados en producción (34 turnos, 2 de
-- Preparación física), así que la constraint entra sin tener que limpiar nada.
--
-- `grupo_id` es nullable (quedan turnos legacy sin mapear, ver `grupo_legacy` en
-- `docs/modelo-datos.md`). En Postgres los NULL no colisionan entre sí en un
-- índice único, así que esos turnos quedan fuera de la regla — que es lo
-- correcto: sin grupo no hay «el turno de ese grupo en esa fecha». Hoy no hay
-- ninguno igual.

alter table public.turnos
  add constraint turnos_grupo_fecha_tipo_unica unique (grupo_id, fecha, tipo);
