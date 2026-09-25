-- Trilha privada e somente de inserção para eventos de acesso sensíveis.
-- Não armazena senha, cookies, tokens, conteúdo de formulários ou backups.

create table public.security_access_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  event_type text not null check (event_type in (
    'login_success',
    'backup_area_opened',
    'backup_exported',
    'backup_restore_started',
    'backup_restore_succeeded',
    'backup_restore_failed'
  )),
  ip_address text check (ip_address is null or char_length(ip_address) <= 64),
  user_agent text check (user_agent is null or char_length(user_agent) <= 1000),
  accept_language text check (accept_language is null or char_length(accept_language) <= 300),
  client_platform text check (client_platform is null or char_length(client_platform) <= 300),
  client_is_mobile boolean,
  request_host text check (request_host is null or char_length(request_host) <= 300),
  is_tls boolean
);

create index security_access_events_user_occurred_idx
  on public.security_access_events (user_id, occurred_at desc);

alter table public.security_access_events enable row level security;

revoke all on public.security_access_events from anon;
grant select, insert on public.security_access_events to authenticated;

create policy "users_select_own_security_access_events" on public.security_access_events for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users_insert_own_security_access_events" on public.security_access_events for insert to authenticated
  with check ((select auth.uid()) = user_id);
