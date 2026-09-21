-- TODO List geral e Rotina diária.

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 240),
  is_daily boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_tasks_do_not_have_permanent_completion check (not is_daily or completed_at is null)
);

create table public.daily_task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_on date not null,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (task_id, completed_on)
);

create index tasks_user_daily_completed_idx on public.tasks (user_id, is_daily, completed_at, created_at desc);
create index tasks_user_completed_at_idx on public.tasks (user_id, completed_at desc) where completed_at is not null;
create index daily_task_completions_user_day_idx on public.daily_task_completions (user_id, completed_on);

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute procedure public.set_updated_at();

alter table public.tasks enable row level security;
alter table public.daily_task_completions enable row level security;

revoke all on public.tasks, public.daily_task_completions from anon;
revoke all on public.tasks, public.daily_task_completions from authenticated;
grant select, insert, update, delete on public.tasks, public.daily_task_completions to authenticated;

create policy "users_select_own_tasks" on public.tasks for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users_insert_own_tasks" on public.tasks for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users_update_own_tasks" on public.tasks for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users_delete_own_tasks" on public.tasks for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "users_select_own_daily_completions" on public.daily_task_completions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users_insert_own_daily_completions" on public.daily_task_completions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users_update_own_daily_completions" on public.daily_task_completions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users_delete_own_daily_completions" on public.daily_task_completions for delete to authenticated
  using ((select auth.uid()) = user_id);
