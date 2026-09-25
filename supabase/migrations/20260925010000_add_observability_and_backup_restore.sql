-- Observabilidade sem conteúdo pessoal e restauração transacional de backups pessoais.

create table public.app_error_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  source text not null check (char_length(source) between 1 and 80),
  code text not null check (char_length(code) between 1 and 120),
  severity text not null default 'error' check (severity in ('warning', 'error'))
);

create index app_error_events_user_occurred_idx
  on public.app_error_events (user_id, occurred_at desc);

alter table public.app_error_events enable row level security;

revoke all on public.app_error_events from anon;
grant select, insert on public.app_error_events to authenticated;

create policy "users_select_own_app_error_events" on public.app_error_events for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users_insert_own_app_error_events" on public.app_error_events for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- O arquivo exportado pela aplicação não traz user_id. A função usa auth.uid()
-- para associar todos os registros restaurados à conta autenticada.
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
  v_key text;
  v_required_keys text[] := array[
    'activities',
    'task_lists',
    'tasks',
    'daily_task_completions',
    'health_weight_entries',
    'body_measurement_types',
    'body_measurement_sessions',
    'body_measurement_values',
    'protocols',
    'protocol_demands',
    'markdown_notes'
  ];
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if p_backup ->> 'format' <> 'diary-tracker-personal-backup' or p_backup ->> 'version' <> '1' then
    raise exception 'Formato de backup não reconhecido.';
  end if;

  if jsonb_typeof(v_data) <> 'object' then
    raise exception 'Dados do backup inválidos.';
  end if;

  foreach v_key in array v_required_keys loop
    if jsonb_typeof(v_data -> v_key) <> 'array' then
      raise exception 'A coleção % é inválida.', v_key;
    end if;
  end loop;

  if p_replace then
    delete from public.daily_task_completions where user_id = v_user_id;
    delete from public.tasks where user_id = v_user_id;
    delete from public.task_lists where user_id = v_user_id;
    delete from public.body_measurement_values where user_id = v_user_id;
    delete from public.body_measurement_sessions where user_id = v_user_id;
    delete from public.body_measurement_types where user_id = v_user_id;
    delete from public.health_weight_entries where user_id = v_user_id;
    delete from public.protocol_demands where user_id = v_user_id;
    delete from public.protocols where user_id = v_user_id;
    delete from public.markdown_notes where user_id = v_user_id;
    delete from public.activities where user_id = v_user_id;
  end if;

  insert into public.task_lists (id, user_id, name, description, sort_order, created_at, updated_at)
  select id, v_user_id, name, description, sort_order, created_at, updated_at
  from jsonb_to_recordset(v_data -> 'task_lists') as row(
    id uuid, name text, description text, sort_order integer, created_at timestamptz, updated_at timestamptz
  )
  on conflict (id) do update set
    name = excluded.name,
    description = excluded.description,
    sort_order = excluded.sort_order;

  insert into public.tasks (id, user_id, title, is_daily, task_list_id, is_important, completed_at, created_at, updated_at)
  select id, v_user_id, title, is_daily, task_list_id, is_important, completed_at, created_at, updated_at
  from jsonb_to_recordset(v_data -> 'tasks') as row(
    id uuid, title text, is_daily boolean, task_list_id uuid, is_important boolean, completed_at timestamptz, created_at timestamptz, updated_at timestamptz
  )
  on conflict (id) do update set
    title = excluded.title,
    is_daily = excluded.is_daily,
    task_list_id = excluded.task_list_id,
    is_important = excluded.is_important,
    completed_at = excluded.completed_at;

  insert into public.daily_task_completions (id, task_id, user_id, completed_on, completed_at, created_at)
  select id, task_id, v_user_id, completed_on, completed_at, created_at
  from jsonb_to_recordset(v_data -> 'daily_task_completions') as row(
    id uuid, task_id uuid, completed_on date, completed_at timestamptz, created_at timestamptz
  )
  on conflict (id) do update set
    task_id = excluded.task_id,
    completed_on = excluded.completed_on,
    completed_at = excluded.completed_at;

  insert into public.health_weight_entries (id, user_id, measured_on, weight_kg, notes, created_at, updated_at)
  select id, v_user_id, measured_on, weight_kg, notes, created_at, updated_at
  from jsonb_to_recordset(v_data -> 'health_weight_entries') as row(
    id uuid, measured_on date, weight_kg numeric, notes text, created_at timestamptz, updated_at timestamptz
  )
  on conflict (id) do update set
    measured_on = excluded.measured_on,
    weight_kg = excluded.weight_kg,
    notes = excluded.notes;

  insert into public.body_measurement_types (id, user_id, name, instructions, unit, sort_order, created_at, updated_at)
  select id, v_user_id, name, instructions, unit, sort_order, created_at, updated_at
  from jsonb_to_recordset(v_data -> 'body_measurement_types') as row(
    id uuid, name text, instructions text, unit text, sort_order integer, created_at timestamptz, updated_at timestamptz
  )
  on conflict (id) do update set
    name = excluded.name,
    instructions = excluded.instructions,
    unit = excluded.unit,
    sort_order = excluded.sort_order;

  insert into public.body_measurement_sessions (id, user_id, measured_on, notes, created_at, updated_at)
  select id, v_user_id, measured_on, notes, created_at, updated_at
  from jsonb_to_recordset(v_data -> 'body_measurement_sessions') as row(
    id uuid, measured_on date, notes text, created_at timestamptz, updated_at timestamptz
  )
  on conflict (id) do update set
    measured_on = excluded.measured_on,
    notes = excluded.notes;

  insert into public.body_measurement_values (id, session_id, measurement_type_id, user_id, value, created_at, updated_at)
  select id, session_id, measurement_type_id, v_user_id, value, created_at, updated_at
  from jsonb_to_recordset(v_data -> 'body_measurement_values') as row(
    id uuid, session_id uuid, measurement_type_id uuid, value numeric, created_at timestamptz, updated_at timestamptz
  )
  on conflict (id) do update set
    session_id = excluded.session_id,
    measurement_type_id = excluded.measurement_type_id,
    value = excluded.value;

  insert into public.protocols (id, user_id, title, created_at, updated_at)
  select id, v_user_id, title, created_at, updated_at
  from jsonb_to_recordset(v_data -> 'protocols') as row(
    id uuid, title text, created_at timestamptz, updated_at timestamptz
  )
  on conflict (id) do update set
    title = excluded.title;

  insert into public.protocol_demands (id, protocol_id, user_id, content, sort_order, created_at, updated_at)
  select id, protocol_id, v_user_id, content, sort_order, created_at, updated_at
  from jsonb_to_recordset(v_data -> 'protocol_demands') as row(
    id uuid, protocol_id uuid, content text, sort_order integer, created_at timestamptz, updated_at timestamptz
  )
  on conflict (id) do update set
    protocol_id = excluded.protocol_id,
    content = excluded.content,
    sort_order = excluded.sort_order;

  insert into public.markdown_notes (id, user_id, title, content, created_at, updated_at)
  select id, v_user_id, title, content, created_at, updated_at
  from jsonb_to_recordset(v_data -> 'markdown_notes') as row(
    id uuid, title text, content text, created_at timestamptz, updated_at timestamptz
  )
  on conflict (id) do update set
    title = excluded.title,
    content = excluded.content;

  insert into public.activities (id, user_id, classification_id, title, started_at, ended_at, created_at, updated_at)
  select id, v_user_id, classification_id, title, started_at, ended_at, created_at, updated_at
  from jsonb_to_recordset(v_data -> 'activities') as row(
    id uuid, classification_id uuid, title text, started_at timestamptz, ended_at timestamptz, created_at timestamptz, updated_at timestamptz
  )
  on conflict (id) do update set
    classification_id = excluded.classification_id,
    title = excluded.title,
    started_at = excluded.started_at,
    ended_at = excluded.ended_at;

  return jsonb_build_object('restored', true, 'mode', case when p_replace then 'replace' else 'merge' end);
end;
$$;

revoke all on function public.restore_personal_backup(jsonb, boolean) from public, anon;
grant execute on function public.restore_personal_backup(jsonb, boolean) to authenticated;
