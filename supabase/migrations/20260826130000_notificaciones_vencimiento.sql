-- Módulo 7 (Sesión 3): Notificaciones — tareas por vencer / vencidas
-- Reutiliza la tabla notificaciones (sesión 1) y el mismo criterio de
-- destinatarios que la sesión 2 (asignados + creador, sin duplicados).
--
-- Diferencia con las sesiones 1 y 2: no hay un INSERT/UPDATE que dispare
-- este aviso por sí solo (fecha_vencimiento no cambia "por acercarse").
-- Se resuelve con un chequeo periódico (pg_cron, 1 vez por día) que evalúa
-- las tareas pendientes/en progreso contra la fecha de hoy.
--
-- fecha_vencimiento es `date` (sin hora, ver docs/modelo-datos.md) — el
-- umbral se calcula en días completos, no en horas: 2 días antes, 1 día
-- antes, y vencida (fecha ya pasada). Decidido con el usuario (2026-08-26):
-- esquema de días en vez de horas porque la columna no tiene componente de
-- hora para calcular una ventana de 48hs/16hs con precisión.
--
-- Cada aviso se genera una sola vez por tarea/destinatario/tipo: antes de
-- insertar, se chequea que no exista ya una notificación con ese mismo
-- (tarea_id, usuario_id, tipo) — evita que correr el cron todos los días
-- reenvíe el mismo aviso mientras la tarea sigue pendiente.

-- =========================================================
-- 1) Función: revisar vencimientos
-- =========================================================
create or replace function public.notificar_tareas_vencimiento()
returns void as $$
begin
  with avisos as (
    select
      t.id as tarea_id,
      t.created_by,
      case
        when (t.fecha_vencimiento - current_date) = 2 then 'tarea_por_vencer_2d'
        when (t.fecha_vencimiento - current_date) = 1 then 'tarea_por_vencer_1d'
        else 'tarea_vencida'
      end as tipo,
      case
        when (t.fecha_vencimiento - current_date) = 2 then 'Vence en 2 días: ' || t.titulo
        when (t.fecha_vencimiento - current_date) = 1 then 'Vence mañana: ' || t.titulo
        else 'Venció: ' || t.titulo
      end as mensaje
    from public.tareas t
    where t.estado in ('Pendiente', 'En progreso')
      and t.fecha_vencimiento is not null
      and (t.fecha_vencimiento - current_date) <= 2
  ),
  destinatarios as (
    select a.tarea_id, ta.usuario_id as destinatario_id
    from avisos a
    join public.tarea_asignados ta on ta.tarea_id = a.tarea_id
    union
    select a.tarea_id, a.created_by as destinatario_id
    from avisos a
    where a.created_by is not null
  )
  insert into public.notificaciones (usuario_id, tipo, mensaje, tarea_id)
  select d.destinatario_id, a.tipo, a.mensaje, a.tarea_id
  from destinatarios d
  join avisos a on a.tarea_id = d.tarea_id
  where not exists (
    select 1 from public.notificaciones n
    where n.tarea_id = a.tarea_id
      and n.usuario_id = d.destinatario_id
      and n.tipo = a.tipo
  );
end;
$$ language plpgsql security definer set search_path = public;

-- =========================================================
-- 2) pg_cron: chequeo diario
-- =========================================================
create extension if not exists pg_cron;

select cron.schedule(
  'notificar_tareas_vencimiento_diario',
  '0 11 * * *', -- 11:00 UTC = 08:00 Argentina (UTC-3, sin horario de verano)
  $$select public.notificar_tareas_vencimiento();$$
);
