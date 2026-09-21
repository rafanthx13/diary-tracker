-- Garante que usuários autenticados possam registrar as próprias atividades.
-- O RLS continua ativo: uma conta nunca pode acessar atividades de outra conta.

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.activities to authenticated;

alter table public.activities enable row level security;

drop policy if exists "users_select_own_activities" on public.activities;
drop policy if exists "users_insert_own_activities" on public.activities;
drop policy if exists "users_update_own_activities" on public.activities;
drop policy if exists "users_delete_own_activities" on public.activities;

create policy "users_select_own_activities" on public.activities for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "users_insert_own_activities" on public.activities for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users_update_own_activities" on public.activities for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "users_delete_own_activities" on public.activities for delete to authenticated
  using ((select auth.uid()) = user_id);
