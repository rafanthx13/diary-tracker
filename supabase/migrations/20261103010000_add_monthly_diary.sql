-- Diário mensal: uma anotação livre e dois marcadores por dia, privados por usuário.

create table if not exists public.monthly_diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  notes text not null default '' check (char_length(notes) <= 10000),
  did_klap boolean not null default false,
  did_exercise boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create index if not exists monthly_diary_entries_user_date_idx
  on public.monthly_diary_entries (user_id, entry_date desc);

drop trigger if exists monthly_diary_entries_set_updated_at on public.monthly_diary_entries;
create trigger monthly_diary_entries_set_updated_at before update on public.monthly_diary_entries
for each row execute procedure public.set_updated_at();

alter table public.monthly_diary_entries enable row level security;
revoke all on public.monthly_diary_entries from anon;
grant select, insert, update, delete on public.monthly_diary_entries to authenticated;

drop policy if exists "users_manage_own_monthly_diary_entries" on public.monthly_diary_entries;
create policy "users_manage_own_monthly_diary_entries" on public.monthly_diary_entries for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Backup v3 acrescenta o Diário Mensal e conserva restaurações de arquivos v1/v2.
do $$
begin
  if to_regprocedure('public.restore_personal_backup_v2(jsonb,boolean)') is null then
    alter function public.restore_personal_backup(jsonb, boolean) rename to restore_personal_backup_v2;
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

  if p_backup ->> 'version' in ('1', '2') then
    if p_replace then
      delete from public.monthly_diary_entries where user_id = v_user_id;
    end if;
    return public.restore_personal_backup_v2(p_backup, p_replace);
  end if;

  if p_backup ->> 'version' <> '3' or jsonb_typeof(v_data -> 'monthly_diary_entries') <> 'array' then
    raise exception 'Formato de backup não reconhecido.';
  end if;

  if p_replace then
    delete from public.monthly_diary_entries where user_id = v_user_id;
  end if;

  v_result := public.restore_personal_backup_v2(jsonb_set(p_backup, '{version}', '2'::jsonb), p_replace);

  insert into public.monthly_diary_entries (id, user_id, entry_date, notes, did_klap, did_exercise, created_at, updated_at)
  select id, v_user_id, entry_date, notes, did_klap, did_exercise, created_at, updated_at
  from jsonb_to_recordset(v_data -> 'monthly_diary_entries') as row(
    id uuid, entry_date date, notes text, did_klap boolean, did_exercise boolean, created_at timestamptz, updated_at timestamptz
  )
  on conflict (id) do update set
    entry_date = excluded.entry_date,
    notes = excluded.notes,
    did_klap = excluded.did_klap,
    did_exercise = excluded.did_exercise;

  return v_result;
end;
$$;

revoke all on function public.restore_personal_backup_v2(jsonb, boolean) from public, anon;
grant execute on function public.restore_personal_backup_v2(jsonb, boolean) to authenticated;
revoke all on function public.restore_personal_backup(jsonb, boolean) from public, anon;
grant execute on function public.restore_personal_backup(jsonb, boolean) to authenticated;
