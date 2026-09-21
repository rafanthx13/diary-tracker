-- Diary Tracker é uma aplicação de uma pessoa.
-- Categorias e classificações formam um catálogo global; atividades permanecem privadas por user_id.

drop trigger if exists seed_diary_tracker_user_after_signup on auth.users;
drop function if exists public.seed_diary_tracker_user();

drop policy if exists "users_select_own_categories" on public.categories;
drop policy if exists "users_insert_own_categories" on public.categories;
drop policy if exists "users_update_own_categories" on public.categories;
drop policy if exists "users_delete_own_categories" on public.categories;
drop policy if exists "users_select_own_classifications" on public.classifications;
drop policy if exists "users_insert_own_classifications" on public.classifications;
drop policy if exists "users_update_own_classifications" on public.classifications;
drop policy if exists "users_delete_own_classifications" on public.classifications;

drop index if exists public.categories_user_name_unique;
drop index if exists public.classifications_user_name_unique;
drop index if exists public.classifications_user_id_idx;

alter table public.classifications drop column if exists user_id;
alter table public.categories drop column if exists user_id;

create unique index categories_name_unique on public.categories (lower(name));
create unique index classifications_name_unique on public.classifications (lower(name));

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.categories, public.classifications to authenticated;

create policy "authenticated_select_categories" on public.categories for select to authenticated using (true);
create policy "authenticated_insert_categories" on public.categories for insert to authenticated with check (true);
create policy "authenticated_update_categories" on public.categories for update to authenticated using (true) with check (true);
create policy "authenticated_delete_categories" on public.categories for delete to authenticated using (true);

create policy "authenticated_select_classifications" on public.classifications for select to authenticated using (true);
create policy "authenticated_insert_classifications" on public.classifications for insert to authenticated with check (true);
create policy "authenticated_update_classifications" on public.classifications for update to authenticated using (true) with check (true);
create policy "authenticated_delete_classifications" on public.classifications for delete to authenticated using (true);

insert into public.categories (name, color) values
  ('TASK', '#2563eb'),
  ('Relax', '#7c3aed'),
  ('Arrumação', '#d97706'),
  ('Comer', '#dc2626'),
  ('Saúde', '#059669'),
  ('Planejamento', '#475569')
on conflict do nothing;

insert into public.classifications (category_id, name)
select category.id, defaults.name
from (
  values
    ('TASK', 'TASK'),
    ('Relax', 'Relax or Games'),
    ('Arrumação', 'Arrumação Quarto'),
    ('Comer', 'Jantar'),
    ('Saúde', 'Academia'),
    ('Planejamento', 'Next Day'),
    ('Planejamento', 'Sair Casa')
) as defaults(category_name, name)
join public.categories as category on category.name = defaults.category_name
on conflict do nothing;
