-- Auditoría Fase B, sesión 2/3 (docs/auditoria-fase-b-2-db-aditivo.md,
-- hallazgo #4): handle_new_user (20260817140000_auth_roles_rls.sql) no
-- seteaba dicta_clases según el rol de alta. La migración original de
-- dicta_clases (20260818150000_users_dicta_clases.sql) puso en true a los
-- Profesores existentes en ese momento, pero cualquier Profesor dado de
-- alta después quedaba en false por el default de la columna (caso real:
-- Keyla, alta 2026-08-25). Sin impacto funcional hoy porque el filtro de
-- "profesor asignable" ya cubre rol = 'Profesor' con un OR, pero se
-- corrige para que el dato quede consistente.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, nombre, rol, dicta_clases)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'rol', 'Empleado'),
    coalesce(new.raw_user_meta_data ->> 'rol', 'Empleado') = 'Profesor'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Corrige el dato de Keyla, dada de alta antes de este fix.
update public.users
  set dicta_clases = true
  where email = 'keyla@gmail.com' and rol = 'Profesor';
