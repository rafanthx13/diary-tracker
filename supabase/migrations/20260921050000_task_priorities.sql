-- Ordenação das abas e destaque de tarefas importantes na TODO List.

alter table public.task_lists
  add column if not exists description text not null default '',
  add column if not exists sort_order integer not null default 0;

with ordered_lists as (
  select id, row_number() over (partition by user_id order by created_at, id) - 1 as position
  from public.task_lists
)
update public.task_lists as task_list
set sort_order = ordered_lists.position
from ordered_lists
where task_list.id = ordered_lists.id;

create index if not exists task_lists_user_sort_idx
  on public.task_lists (user_id, sort_order, created_at);

alter table public.tasks
  add column if not exists is_important boolean not null default false;

create index if not exists tasks_user_list_importance_idx
  on public.tasks (user_id, task_list_id, is_important desc, created_at desc)
  where completed_at is null and not is_daily;
