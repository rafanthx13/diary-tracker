-- Módulo Sono: um registro por dia em que a pessoa acordou e uma meta pessoal.

create table if not exists public.health_sleep_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  goal_minutes integer not null default 420 check (goal_minutes between 60 and 960),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.health_sleep_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slept_on date not null,
  sleep_time time not null,
  wake_time time not null,
  quality_score smallint not null check (quality_score between 0 and 10),
  description text not null default '' check (char_length(description) <= 500),
  duration_minutes integer not null check (duration_minutes between 60 and 960),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slept_on),
  check (
    duration_minutes = case
      when wake_time > sleep_time then (extract(epoch from (wake_time - sleep_time)) / 60)::integer
      else (extract(epoch from (wake_time - sleep_time + interval '1 day')) / 60)::integer
    end
  )
);

create index if not exists health_sleep_entries_user_date_idx on public.health_sleep_entries (user_id, slept_on desc);

drop trigger if exists health_sleep_settings_set_updated_at on public.health_sleep_settings;
create trigger health_sleep_settings_set_updated_at before update on public.health_sleep_settings
for each row execute procedure public.set_updated_at();
drop trigger if exists health_sleep_entries_set_updated_at on public.health_sleep_entries;
create trigger health_sleep_entries_set_updated_at before update on public.health_sleep_entries
for each row execute procedure public.set_updated_at();

alter table public.health_sleep_settings enable row level security;
alter table public.health_sleep_entries enable row level security;

revoke all on public.health_sleep_settings, public.health_sleep_entries from anon;
grant select, insert, update, delete on public.health_sleep_settings, public.health_sleep_entries to authenticated;

drop policy if exists "users_manage_own_sleep_settings" on public.health_sleep_settings;
create policy "users_manage_own_sleep_settings" on public.health_sleep_settings for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "users_manage_own_sleep_entries" on public.health_sleep_entries;
create policy "users_manage_own_sleep_entries" on public.health_sleep_entries for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- O backup v2 acrescenta sono, mantendo compatibilidade com a restauração v1.
-- A condição também permite reaplicar o arquivo caso a execução anterior tenha
-- parado depois de renomear a função antiga.
do $$
begin
  if to_regprocedure('public.restore_personal_backup_v1(jsonb,boolean)') is null then
    alter function public.restore_personal_backup(jsonb, boolean) rename to restore_personal_backup_v1;
  end if;
end;
$$;

create or replace function public.restore_personal_backup(
  p_backup jsonb,
  p_replace boolean default false
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_data jsonb := p_backup -> 'data';
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if p_backup ->> 'format' <> 'diary-tracker-personal-backup' then
    raise exception 'Formato de backup não reconhecido.';
  end if;

  if p_backup ->> 'version' = '1' then
    if p_replace then
      delete from public.health_sleep_entries where user_id = v_user_id;
      delete from public.health_sleep_settings where user_id = v_user_id;
    end if;
    return public.restore_personal_backup_v1(p_backup, p_replace);
  end if;

  if p_backup ->> 'version' <> '2' or jsonb_typeof(v_data -> 'health_sleep_settings') <> 'array' or jsonb_typeof(v_data -> 'health_sleep_entries') <> 'array' then
    raise exception 'Formato de backup não reconhecido.';
  end if;

  if p_replace then
    delete from public.health_sleep_entries where user_id = v_user_id;
    delete from public.health_sleep_settings where user_id = v_user_id;
  end if;

  v_result := public.restore_personal_backup_v1(jsonb_set(p_backup, '{version}', '1'::jsonb), p_replace);

  insert into public.health_sleep_settings (user_id, goal_minutes, created_at, updated_at)
  select v_user_id, goal_minutes, created_at, updated_at
  from jsonb_to_recordset(v_data -> 'health_sleep_settings') as row(
    goal_minutes integer, created_at timestamptz, updated_at timestamptz
  )
  on conflict (user_id) do update set goal_minutes = excluded.goal_minutes;

  insert into public.health_sleep_entries (id, user_id, slept_on, sleep_time, wake_time, quality_score, description, duration_minutes, created_at, updated_at)
  select id, v_user_id, slept_on, sleep_time, wake_time, quality_score, description, duration_minutes, created_at, updated_at
  from jsonb_to_recordset(v_data -> 'health_sleep_entries') as row(
    id uuid, slept_on date, sleep_time time, wake_time time, quality_score smallint, description text, duration_minutes integer, created_at timestamptz, updated_at timestamptz
  )
  on conflict (id) do update set
    slept_on = excluded.slept_on,
    sleep_time = excluded.sleep_time,
    wake_time = excluded.wake_time,
    quality_score = excluded.quality_score,
    description = excluded.description,
    duration_minutes = excluded.duration_minutes;

  return v_result;
end;
$$;

revoke all on function public.restore_personal_backup_v1(jsonb, boolean) from public, anon;
grant execute on function public.restore_personal_backup_v1(jsonb, boolean) to authenticated;
revoke all on function public.restore_personal_backup(jsonb, boolean) from public, anon;
grant execute on function public.restore_personal_backup(jsonb, boolean) to authenticated;
