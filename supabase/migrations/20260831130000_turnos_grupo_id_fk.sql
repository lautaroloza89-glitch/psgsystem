-- Fase 1.2 (Sesión 2): Clases/Turnos — grupo por FK real, horario derivado del grupo
-- Reemplaza el texto libre turnos.grupo_nivel por una selección real contra
-- la tabla `grupos` (Fase 2, Sesión 1). El texto viejo no se borra: se
-- renombra a grupo_legacy para que Lauti pueda revisar a mano contra qué
-- grupo real corresponde cada fila ya cargada, antes de dropear la columna.

alter table public.turnos
  rename column grupo_nivel to grupo_legacy;

-- Los turnos nuevos ya no completan texto libre (el formulario pasa a usar
-- grupo_id), así que la columna deja de poder ser not null.
alter table public.turnos
  alter column grupo_legacy drop not null;

alter table public.turnos
  add column grupo_id uuid references public.grupos (id) on delete set null;

create index turnos_grupo_id_idx on public.turnos (grupo_id);

-- El trigger de notificación de comentarios de turno armaba el mensaje
-- leyendo grupo_nivel directo (columna que ya no existe con ese nombre) — se
-- actualiza para usar el nombre real del grupo (grupos.nombre) una vez
-- mapeado, con fallback al texto legacy para las filas que todavía no se
-- remapearon manualmente.
create or replace function public.notificar_comentario_turno_nuevo()
returns trigger as $$
declare
  v_grupo_nombre text;
  v_profesor_id uuid;
  v_autor_nombre text;
begin
  select coalesce(g.nombre, t.grupo_legacy), t.profesor_id
    into v_grupo_nombre, v_profesor_id
  from public.turnos t
  left join public.grupos g on g.id = t.grupo_id
  where t.id = new.turno_id;

  if v_profesor_id is not null and v_profesor_id is distinct from new.autor_id then
    select nombre into v_autor_nombre from public.users where id = new.autor_id;

    insert into public.notificaciones (usuario_id, tipo, mensaje, turno_id)
    values (
      v_profesor_id,
      'comentario_turno_nuevo',
      coalesce(v_autor_nombre, 'Alguien') || ' comentó en el turno: ' || coalesce(v_grupo_nombre, 'una clase'),
      new.turno_id
    );
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;
