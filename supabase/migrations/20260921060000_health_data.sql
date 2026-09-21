-- Módulo Dados de Saúde: peso diário e medidas corporais.

create table public.health_weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  measured_on date not null,
  weight_kg numeric(6,2) not null check (weight_kg > 0 and weight_kg <= 500),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, measured_on)
);

create table public.body_measurement_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  instructions text not null default '',
  unit text not null default 'cm' check (char_length(trim(unit)) between 1 and 16),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index body_measurement_types_user_name_unique
  on public.body_measurement_types (user_id, lower(name));
create index body_measurement_types_user_sort_idx
  on public.body_measurement_types (user_id, sort_order, created_at);

create table public.body_measurement_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  measured_on date not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, measured_on)
);

create table public.body_measurement_values (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.body_measurement_sessions(id) on delete cascade,
  measurement_type_id uuid not null references public.body_measurement_types(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  value numeric(8,2) not null check (value > 0 and value <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, measurement_type_id)
);

create index health_weight_user_date_idx on public.health_weight_entries (user_id, measured_on desc);
create index body_measurement_sessions_user_date_idx on public.body_measurement_sessions (user_id, measured_on desc);
create index body_measurement_values_user_type_idx on public.body_measurement_values (user_id, measurement_type_id);

create trigger health_weight_entries_set_updated_at before update on public.health_weight_entries
for each row execute procedure public.set_updated_at();
create trigger body_measurement_types_set_updated_at before update on public.body_measurement_types
for each row execute procedure public.set_updated_at();
create trigger body_measurement_sessions_set_updated_at before update on public.body_measurement_sessions
for each row execute procedure public.set_updated_at();
create trigger body_measurement_values_set_updated_at before update on public.body_measurement_values
for each row execute procedure public.set_updated_at();

alter table public.health_weight_entries enable row level security;
alter table public.body_measurement_types enable row level security;
alter table public.body_measurement_sessions enable row level security;
alter table public.body_measurement_values enable row level security;

revoke all on public.health_weight_entries, public.body_measurement_types, public.body_measurement_sessions, public.body_measurement_values from anon;
grant select, insert, update, delete on public.health_weight_entries, public.body_measurement_types, public.body_measurement_sessions, public.body_measurement_values to authenticated;

create policy "users_manage_own_weight_entries" on public.health_weight_entries for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users_manage_own_measurement_types" on public.body_measurement_types for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users_manage_own_measurement_sessions" on public.body_measurement_sessions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users_manage_own_measurement_values" on public.body_measurement_values for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

insert into public.body_measurement_types (user_id, name, instructions, unit, sort_order)
select users.id, defaults.name, defaults.instructions, 'cm', defaults.sort_order
from auth.users as users
cross join (values
  ('Bíceps Direito', '', 0),
  ('Bíceps Esquerdo', '', 1),
  ('Peitoral', 'Mamilo / tórax', 2),
  ('Cintura Maior', 'No umbigo', 3),
  ('Cintura Menor', 'Menor região, abaixo do mamilo', 4),
  ('Bunda', 'Hip / pelvis', 5),
  ('Pulso', 'Wrist', 6),
  ('Joelho Direito', 'Na bola do joelho', 7),
  ('Coxa Direita', 'Quads; manter o mesmo ponto de medição', 8),
  ('Panturrilha Direita', 'Calf / batata do pé', 9),
  ('Pescoço', '', 10)
) as defaults(name, instructions, sort_order)
on conflict do nothing;
