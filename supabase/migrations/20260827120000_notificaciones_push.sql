-- Módulo 7 (Sesión 4): Notificaciones push
-- Reutiliza la tabla notificaciones y no toca los 3 triggers existentes
-- (tarea asignada, comentario nuevo, vencimiento). Se engancha directo a
-- notificaciones con un trigger nuevo, así cubre los 3 tipos existentes
-- (y cualquiera futuro) sin duplicar lógica por tipo de aviso.

-- =========================================================
-- 1) Tabla push_subscriptions
-- =========================================================
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_usuario_id_idx
  on public.push_subscriptions (usuario_id);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select_propias"
  on public.push_subscriptions for select
  to authenticated
  using (usuario_id = auth.uid());

create policy "push_subscriptions_insert_propias"
  on public.push_subscriptions for insert
  to authenticated
  with check (usuario_id = auth.uid());

create policy "push_subscriptions_delete_propias"
  on public.push_subscriptions for delete
  to authenticated
  using (usuario_id = auth.uid());

-- =========================================================
-- 2) pg_net + secreto compartido en Vault
-- =========================================================
-- pg_net permite llamadas HTTP async desde un trigger (crea su propio
-- schema `net`). Vault (ya habilitado, sin uso hasta ahora) guarda el
-- secreto cifrado en vez de dejarlo en texto plano en el código SQL.
create extension if not exists pg_net;

select vault.create_secret(
  'ac6fe0098c098396ae56468d7c11a1ccb23813597ad80df7841cf2de6e42466b',
  'push_shared_secret',
  'Secreto compartido entre el trigger notificar_push y la Edge Function send-push'
);

-- =========================================================
-- 3) Trigger: enviar push en cada notificación nueva
-- =========================================================
create or replace function public.notificar_push()
returns trigger as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'push_shared_secret';

  perform net.http_post(
    url := 'https://gbnpebqcobtoegeagmcl.supabase.co/functions/v1/send-push',
    body := jsonb_build_object(
      'usuario_id', new.usuario_id,
      'mensaje', new.mensaje,
      'tarea_id', new.tarea_id
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', v_secret
    ),
    timeout_milliseconds := 5000
  );

  return new;
end;
$$ language plpgsql security definer set search_path = public, net, vault;

create trigger notificaciones_push
  after insert on public.notificaciones
  for each row execute function public.notificar_push();
