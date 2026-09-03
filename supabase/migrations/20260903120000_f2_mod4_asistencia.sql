-- Sistema PSG, Fase 2 — F2 MOD 4: Asistencia.
--
-- Una fila por alumna por fecha de clase. El guardado es en bloque: al
-- confirmar una fecha se crea (o actualiza) una fila por CADA alumna activa
-- del grupo — `presente = true` para las tildadas, `presente = false` para el
-- resto. No quedan alumnas "sin registro" en una fecha ya guardada; eso es lo
-- que le da datos completos al cálculo de la alerta de inasistencias.

create table public.asistencia (
  id uuid primary key default gen_random_uuid(),
  -- restrict (no cascade): borrar una alumna no debe destruir en silencio su
  -- historial, mismo criterio que pagos.alumna_id.
  alumna_id uuid not null references public.alumnas (id) on delete restrict,
  -- SNAPSHOT del grupo en el que estaba la alumna ese día, no una referencia
  -- viva: si después cambia de grupo, el historial viejo tiene que seguir
  -- mostrando el grupo real de ese día. Por eso nunca se deriva de
  -- alumnas.grupo_id al leer.
  grupo_id uuid not null references public.grupos (id) on delete restrict,
  fecha date not null,
  presente boolean not null,
  -- not null: protege el registro de auditoría (restrict en vez de set null),
  -- mismo criterio que pagos.registrado_por.
  registrado_por uuid not null references public.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  -- Una sola fila por alumna por día: si la misma fecha se vuelve a guardar,
  -- se actualiza la fila existente (upsert por este par), no se duplica.
  constraint asistencia_alumna_fecha_unica unique (alumna_id, fecha),
  -- Asistencia no se toma los sábados, ni siquiera para Jungla (que sí tiene
  -- bloque de sábado en grupo_horarios). El filtro vive también en la UI —
  -- acá queda como red de seguridad para que ninguna vía de escritura pueda
  -- meter un sábado. 6 = sábado en isodow (misma convención que
  -- grupo_horarios.dias).
  constraint asistencia_sin_sabados check (extract(isodow from fecha) <> 6)
);

-- Navegación grupo → mes → fecha: lista las fechas ya cargadas de un grupo
-- en un rango.
create index asistencia_grupo_id_fecha_idx on public.asistencia (grupo_id, fecha);
-- Alerta de inasistencias: recorre las semanas hacia atrás de cada alumna.
create index asistencia_alumna_id_fecha_idx on public.asistencia (alumna_id, fecha);

alter table public.asistencia enable row level security;

-- =========================================================
-- RLS: lectura y escritura para Admin, Head Coach y Secretaria — mismo
-- patrón que alumnas/contactos (Fase 2, Sesión 1) y pagos (F2 MOD 3).
-- 'Secretaria' todavía no es un valor posible de users.rol (Dai sigue en
-- 'Admin' como parche temporal, ver PROGRESS.md); la policy queda escrita
-- contra el rol correcto para que funcione sola cuando ese parche se
-- resuelva, sin otra migración.
-- =========================================================
create policy "asistencia_admin_headcoach_secretaria"
  on public.asistencia for all
  to authenticated
  using (public.current_user_rol() in ('Admin', 'Head Coach', 'Secretaria'))
  with check (public.current_user_rol() in ('Admin', 'Head Coach', 'Secretaria'));
