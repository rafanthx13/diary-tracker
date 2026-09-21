-- Diary Tracker: autenticação privada e registro de atividades.
-- Execute este arquivo no SQL Editor do Supabase antes de criar o primeiro usuário.

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  color text not null default '#0f766e' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index categories_user_name_unique
  on public.categories (user_id, lower(name));

create table public.classifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index classifications_user_name_unique
  on public.classifications (user_id, lower(name));
create index classifications_user_id_idx on public.classifications (user_id);
create index classifications_category_id_idx on public.classifications (category_id);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  classification_id uuid not null references public.classifications(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 240),
  started_at timestamptz not null,
  ended_at timestamptz,
  tracking_date date generated always as ((started_at at time zone 'America/Sao_Paulo')::date) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activities_end_after_start check (ended_at is null or ended_at > started_at)
);

create index activities_user_date_idx on public.activities (user_id, tracking_date, started_at);
create index activities_classification_id_idx on public.activities (classification_id);
create unique index activities_one_running_per_user
  on public.activities (user_id)
  where ended_at is null;

-- Atividades encerradas não podem sobrepor períodos já registrados.
alter table public.activities
  add constraint activities_no_overlapping_periods
  exclude using gist (
    user_id with =,
    tstzrange(started_at, ended_at, '[)') with &&
  ) where (ended_at is not null);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger categories_set_updated_at
before update on public.categories
for each row execute procedure public.set_updated_at();

create trigger classifications_set_updated_at
before update on public.classifications
for each row execute procedure public.set_updated_at();

create trigger activities_set_updated_at
before update on public.activities
for each row execute procedure public.set_updated_at();

-- Cria o catálogo inicial para cada conta nova. Os IDs são estáveis;
-- nomes e cores podem ser atualizados sem alterar os registros de atividades.
create or replace function public.seed_diary_tracker_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  task_category_id uuid;
  relax_category_id uuid;
  organization_category_id uuid;
  food_category_id uuid;
  health_category_id uuid;
  planning_category_id uuid;
begin
  insert into public.categories (user_id, name, color) values
    (new.id, 'TASK', '#2563eb'),
    (new.id, 'Relax', '#7c3aed'),
    (new.id, 'Arrumação', '#d97706'),
    (new.id, 'Comer', '#dc2626'),
    (new.id, 'Saúde', '#059669'),
    (new.id, 'Planejamento', '#475569');

  select id into task_category_id from public.categories where user_id = new.id and name = 'TASK';
  select id into relax_category_id from public.categories where user_id = new.id and name = 'Relax';
  select id into organization_category_id from public.categories where user_id = new.id and name = 'Arrumação';
  select id into food_category_id from public.categories where user_id = new.id and name = 'Comer';
  select id into health_category_id from public.categories where user_id = new.id and name = 'Saúde';
  select id into planning_category_id from public.categories where user_id = new.id and name = 'Planejamento';

  insert into public.classifications (user_id, category_id, name) values
    (new.id, task_category_id, 'TASK'),
    (new.id, relax_category_id, 'Relax or Games'),
    (new.id, organization_category_id, 'Arrumação Quarto'),
    (new.id, food_category_id, 'Jantar'),
    (new.id, health_category_id, 'Academia'),
    (new.id, planning_category_id, 'Next Day'),
    (new.id, planning_category_id, 'Sair Casa');

  return new;
end;
$$;

create trigger seed_diary_tracker_user_after_signup
after insert on auth.users
for each row execute procedure public.seed_diary_tracker_user();

alter table public.categories enable row level security;
alter table public.classifications enable row level security;
alter table public.activities enable row level security;

revoke all on public.categories, public.classifications, public.activities from anon;
revoke all on public.categories, public.classifications, public.activities from authenticated;
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.categories, public.classifications, public.activities to authenticated;

create policy "users_select_own_categories" on public.categories for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users_insert_own_categories" on public.categories for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users_update_own_categories" on public.categories for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users_delete_own_categories" on public.categories for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "users_select_own_classifications" on public.classifications for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users_insert_own_classifications" on public.classifications for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users_update_own_classifications" on public.classifications for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users_delete_own_classifications" on public.classifications for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "users_select_own_activities" on public.activities for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users_insert_own_activities" on public.activities for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users_update_own_activities" on public.activities for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users_delete_own_activities" on public.activities for delete to authenticated
  using ((select auth.uid()) = user_id);
