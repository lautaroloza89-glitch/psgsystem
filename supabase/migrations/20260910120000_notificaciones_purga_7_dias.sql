-- Sistema PSG — Correcciones post-rediseño, Bloque 2: las notificaciones se
-- borran solas a los 7 días.
--
-- `notificaciones` no tenía ninguna política de retención: crece para siempre.
-- Cada tarea asignada, cada comentario, cada clase asignada y cada aviso de
-- vencimiento deja una fila que nadie borra nunca (la única policy de `delete`
-- es `notificaciones_delete_admin`, y es a mano). Con ~10 personas no es un
-- problema de tamaño, pero el ícono de campana muestra el histórico entero y
-- una notificación de hace dos meses no le sirve a nadie.
--
-- Mismo mecanismo que el chequeo de tareas por vencer
-- (`20260826130000_notificaciones_vencimiento.sql`): un job de pg_cron más
-- sobre la extensión ya instalada, no hace falta infraestructura nueva.
--
-- CONSECUENCIA CONOCIDA sobre el dedup de vencimientos: la función
-- `notificar_tareas_vencimiento()` evita repetir un aviso chequeando que no
-- exista ya una fila con el mismo `(tarea_id, usuario_id, tipo)`. Al borrarse
-- esa fila a los 7 días, una tarea que sigue vencida y sin completar vuelve a
-- generar su aviso de `'tarea_vencida'` (y su push) en el chequeo diario
-- siguiente. Queda así a propósito: una tarea vencida hace más de una semana y
-- todavía sin tocar merece que el aviso vuelva a aparecer. Los tipos
-- `'tarea_por_vencer_2d'` y `'tarea_por_vencer_1d'` no se repiten por este
-- camino: cuando la fila cumple 7 días, la tarea ya pasó a `'tarea_vencida'`
-- y esos umbrales no vuelven a matchear.

-- =========================================================
-- 1) Función: borrar lo que ya pasó los 7 días
-- =========================================================
create or replace function public.purgar_notificaciones_viejas()
returns void as $$
begin
  -- Sin distinguir `leida`: a los 7 días una notificación sin leer tampoco
  -- aporta nada, y el evento que la originó sigue vivo en su módulo (la tarea,
  -- la clase, el comentario). Con el volumen del club (~10 usuarios) el costo
  -- del barrido diario es irrelevante.
  delete from public.notificaciones
  where creado_en < now() - interval '7 days';
end;
$$ language plpgsql security definer set search_path = public;

-- =========================================================
-- 2) pg_cron: purga diaria
-- =========================================================
create extension if not exists pg_cron;

select cron.schedule(
  'purgar_notificaciones_viejas_diario',
  '0 5 * * *', -- 05:00 UTC = 02:00 Argentina (UTC-3), fuera de horario de uso
  $$select public.purgar_notificaciones_viejas();$$
);
