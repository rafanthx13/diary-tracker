-- Status explícito para atividades diárias que não serão realizadas em uma data.

alter table public.tasks
  add column if not exists allows_not_done boolean not null default false;

alter table public.daily_task_completions
  add column if not exists status text not null default 'completed'
    check (status in ('completed', 'not_done'));

create index if not exists daily_task_completions_user_status_day_idx
  on public.daily_task_completions (user_id, status, completed_on);

-- Mantém a versão anterior da restauração como base e restaura os novos campos
-- depois dela. Backups anteriores, que não têm esses campos, continuam válidos.
alter function public.restore_personal_backup(jsonb, boolean)
  rename to restore_personal_backup_v1;

create function public.restore_personal_backup(
  p_backup jsonb,
  p_replace boolean default false
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_result jsonb;
begin
  v_result := public.restore_personal_backup_v1(p_backup, p_replace);

  update public.tasks as task
  set allows_not_done = coalesce(backup.allows_not_done, task.allows_not_done)
  from jsonb_to_recordset(p_backup -> 'data' -> 'tasks') as backup(
    id uuid, allows_not_done boolean
  )
  where task.id = backup.id
    and task.user_id = auth.uid();

  update public.daily_task_completions as completion
  set status = coalesce(backup.status, completion.status)
  from jsonb_to_recordset(p_backup -> 'data' -> 'daily_task_completions') as backup(
    id uuid, status text
  )
  where completion.id = backup.id
    and completion.user_id = auth.uid();

  return v_result;
end;
$$;

revoke all on function public.restore_personal_backup(jsonb, boolean) from public, anon;
grant execute on function public.restore_personal_backup(jsonb, boolean) to authenticated;
