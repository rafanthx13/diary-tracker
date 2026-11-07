-- Módulo Quick Notes: uma única anotação rápida e privada por usuário.

create table public.quick_notes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  content text not null default '' check (char_length(content) <= 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger quick_notes_set_updated_at
before update on public.quick_notes
for each row execute procedure public.set_updated_at();

alter table public.quick_notes enable row level security;

revoke all on public.quick_notes from anon;
grant select, insert, update, delete on public.quick_notes to authenticated;

create policy "users_select_own_quick_note" on public.quick_notes for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users_insert_own_quick_note" on public.quick_notes for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users_update_own_quick_note" on public.quick_notes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users_delete_own_quick_note" on public.quick_notes for delete to authenticated
  using ((select auth.uid()) = user_id);
