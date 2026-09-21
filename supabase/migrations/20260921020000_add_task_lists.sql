-- Abas personalizadas da TODO List. Elas não têm relação com categorias de tempo.

create table public.task_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index task_lists_user_name_unique on public.task_lists (user_id, lower(name));
create index task_lists_user_created_idx on public.task_lists (user_id, created_at);

alter table public.tasks add column if not exists task_list_id uuid references public.task_lists(id) on delete set null;
alter table public.tasks drop constraint if exists daily_tasks_do_not_have_task_list;
alter table public.tasks add constraint daily_tasks_do_not_have_task_list check (not is_daily or task_list_id is null);
create index tasks_user_list_completed_idx on public.tasks (user_id, task_list_id, completed_at, created_at desc);

create trigger task_lists_set_updated_at
before update on public.task_lists
for each row execute procedure public.set_updated_at();

alter table public.task_lists enable row level security;

revoke all on public.task_lists from anon;
grant select, insert, update, delete on public.task_lists to authenticated;

create policy "users_select_own_task_lists" on public.task_lists for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users_insert_own_task_lists" on public.task_lists for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users_update_own_task_lists" on public.task_lists for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users_delete_own_task_lists" on public.task_lists for delete to authenticated
  using ((select auth.uid()) = user_id);
