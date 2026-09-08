-- Sistema PSG, Correcciones pre-UI — Bloque 5: participación en torneos.
--
-- Estaba pendiente desde F2 MOD 5 (el módulo de Torneos registra qué se corre
-- y cuándo, no quién va) y quedó definido. Esta migración es solo el modelo:
-- las tres pantallas del recorrido (listado de alumnas activas con buscador y
-- filtro por grupo, marcar convocadas, control de inscripción paga) son parte
-- de la UI nueva.
--
-- **No se modelan categorías federativas.** Son demasiadas y varían por torneo
-- y federación: la categoría en la que compite cada alumna es texto libre que
-- escribe quien arma la lista ("C5 9", "FM 11", "PFM 12", "C5 13 FED"), y vive
-- en la convocatoria de ese torneo, no en la ficha de la alumna. Para convocar,
-- el eje de búsqueda es `alumnas.grupo_id`, que ya existe: los grupos del club
-- se arman por habilidad, no por edad.

-- Valor de la inscripción por alumna de ese torneo, para precargar en la
-- convocatoria. Nullable: hay eventos sin inscripción.
alter table public.torneos add column inscripcion_monto numeric(10,2) null;

-- =========================================================
-- Una fila por alumna convocada a un torneo.
--
-- La lista de convocadas es la planilla que se manda a la organización:
-- nombre, DNI, fecha de nacimiento y categoría.
-- =========================================================
create table public.torneo_participantes (
  id uuid primary key default gen_random_uuid(),
  torneo_id uuid not null references public.torneos (id) on delete cascade,
  -- `restrict` a propósito: borrar una alumna no puede llevarse puesto el
  -- histórico de en qué torneos compitió. Mismo criterio que pagos.alumna_id.
  alumna_id uuid not null references public.alumnas (id) on delete restrict,
  -- Texto libre, sin enum ni validación (ver el comentario de arriba).
  categoria text null,
  -- 'Exenta' existe porque a veces no se cobra la inscripción.
  inscripcion_estado text not null default 'Pendiente'
    check (inscripcion_estado in ('Pendiente', 'Paga', 'Exenta')),
  -- Se precarga de torneos.inscripcion_monto y se puede pisar por alumna.
  inscripcion_monto numeric(10,2) null,
  -- Une la inscripción con el pago real, cuando se cobró por el circuito de Pagos.
  pago_id uuid null references public.pagos (id) on delete set null,
  -- Mismo criterio que asistencia.registrado_por y pagos.registrado_por.
  convocada_por uuid not null references public.users (id) on delete restrict,
  creado_en timestamptz not null default now(),
  constraint torneo_participantes_torneo_alumna_unica unique (torneo_id, alumna_id)
);

create index torneo_participantes_torneo_id_idx on public.torneo_participantes (torneo_id);
create index torneo_participantes_alumna_id_idx on public.torneo_participantes (alumna_id);

alter table public.torneo_participantes enable row level security;

-- =========================================================
-- RLS.
--
-- Patinador/a y Empleado/a no acceden a nada de participación en torneos: no
-- figuran en ninguna policy, así que la tabla no existe para ellos ni entrando
-- por URL directa. El gate del servidor va además en la aplicación.
--
-- Convocar y sacar alumnas es una decisión deportiva: solo Admin y Head Coach.
-- El estado de inscripción y el pago los lleva también Secretaria.
--
-- La Profesora ve la lista de convocadas pero no la plata. Eso no se puede
-- expresar en una policy (la RLS es por fila, no por columna): la policy le da
-- acceso a la fila y es la aplicación la que no le pide `inscripcion_monto`,
-- `inscripcion_estado` ni `pago_id` — mismo criterio que el email del personal
-- en /miembros. Por la misma razón, `categoria` (que según el alcance escriben
-- Admin o Head Coach) queda cubierta por la policy de update de Secretaria y se
-- limita del lado de la aplicación.
-- =========================================================
create policy "torneo_participantes_select"
  on public.torneo_participantes for select
  to authenticated
  using (public.current_user_rol() in ('Admin', 'Head Coach', 'Secretaria', 'Profesor'));

create policy "torneo_participantes_insert_admin_headcoach"
  on public.torneo_participantes for insert
  to authenticated
  with check (public.current_user_rol() in ('Admin', 'Head Coach'));

create policy "torneo_participantes_delete_admin_headcoach"
  on public.torneo_participantes for delete
  to authenticated
  using (public.current_user_rol() in ('Admin', 'Head Coach'));

create policy "torneo_participantes_update_admin_headcoach_secretaria"
  on public.torneo_participantes for update
  to authenticated
  using (public.current_user_rol() in ('Admin', 'Head Coach', 'Secretaria'))
  with check (public.current_user_rol() in ('Admin', 'Head Coach', 'Secretaria'));
