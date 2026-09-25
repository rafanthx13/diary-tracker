-- Módulo Anotações: protocolos com demandas ordenadas e notas em Markdown.

create table public.protocols (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.protocol_demands (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 1000),
  sort_order integer not null check (sort_order > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint protocol_demands_protocol_user_fk
    foreign key (protocol_id, user_id)
    references public.protocols(id, user_id)
    on delete cascade,
  unique (protocol_id, sort_order)
);

create table public.markdown_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  content text not null default '' check (char_length(content) <= 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index protocols_user_updated_idx on public.protocols (user_id, updated_at desc);
create index protocol_demands_protocol_order_idx on public.protocol_demands (protocol_id, sort_order);
create index markdown_notes_user_updated_idx on public.markdown_notes (user_id, updated_at desc);

create trigger protocols_set_updated_at
before update on public.protocols
for each row execute procedure public.set_updated_at();

create trigger protocol_demands_set_updated_at
before update on public.protocol_demands
for each row execute procedure public.set_updated_at();

create trigger markdown_notes_set_updated_at
before update on public.markdown_notes
for each row execute procedure public.set_updated_at();

alter table public.protocols enable row level security;
alter table public.protocol_demands enable row level security;
alter table public.markdown_notes enable row level security;

revoke all on public.protocols, public.protocol_demands, public.markdown_notes from anon;
grant select, insert, update, delete on public.protocols, public.protocol_demands, public.markdown_notes to authenticated;

create policy "users_select_own_protocols" on public.protocols for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users_insert_own_protocols" on public.protocols for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users_update_own_protocols" on public.protocols for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users_delete_own_protocols" on public.protocols for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "users_select_own_protocol_demands" on public.protocol_demands for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users_insert_own_protocol_demands" on public.protocol_demands for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users_update_own_protocol_demands" on public.protocol_demands for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users_delete_own_protocol_demands" on public.protocol_demands for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "users_select_own_markdown_notes" on public.markdown_notes for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users_insert_own_markdown_notes" on public.markdown_notes for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users_update_own_markdown_notes" on public.markdown_notes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users_delete_own_markdown_notes" on public.markdown_notes for delete to authenticated
  using ((select auth.uid()) = user_id);

-- As funções mantêm título, demandas e ordem em uma única transação.
create or replace function public.create_protocol_with_demands(
  p_title text,
  p_demands text[]
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_protocol_id uuid;
  demand_content text;
  demand_order integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;
  if char_length(trim(p_title)) not between 1 and 160 then
    raise exception 'Título inválido.';
  end if;
  if cardinality(coalesce(p_demands, array[]::text[])) > 100 then
    raise exception 'Um protocolo pode ter no máximo 100 demandas.';
  end if;

  insert into public.protocols (user_id, title)
  values (auth.uid(), trim(p_title))
  returning id into new_protocol_id;

  foreach demand_content in array coalesce(p_demands, array[]::text[]) loop
    if char_length(trim(demand_content)) not between 1 and 1000 then
      raise exception 'Demanda inválida.';
    end if;
    demand_order := demand_order + 1;
    insert into public.protocol_demands (protocol_id, user_id, content, sort_order)
    values (new_protocol_id, auth.uid(), trim(demand_content), demand_order);
  end loop;

  return new_protocol_id;
end;
$$;

create or replace function public.update_protocol_with_demands(
  p_protocol_id uuid,
  p_title text,
  p_demands text[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  demand_content text;
  demand_order integer := 0;
begin
  if char_length(trim(p_title)) not between 1 and 160 then
    raise exception 'Título inválido.';
  end if;
  if cardinality(coalesce(p_demands, array[]::text[])) > 100 then
    raise exception 'Um protocolo pode ter no máximo 100 demandas.';
  end if;

  update public.protocols
  set title = trim(p_title)
  where id = p_protocol_id and user_id = auth.uid();
  if not found then
    raise exception 'Protocolo não encontrado.';
  end if;

  delete from public.protocol_demands
  where protocol_id = p_protocol_id and user_id = auth.uid();

  foreach demand_content in array coalesce(p_demands, array[]::text[]) loop
    if char_length(trim(demand_content)) not between 1 and 1000 then
      raise exception 'Demanda inválida.';
    end if;
    demand_order := demand_order + 1;
    insert into public.protocol_demands (protocol_id, user_id, content, sort_order)
    values (p_protocol_id, auth.uid(), trim(demand_content), demand_order);
  end loop;
end;
$$;

revoke all on function public.create_protocol_with_demands(text, text[]) from public, anon;
revoke all on function public.update_protocol_with_demands(uuid, text, text[]) from public, anon;
grant execute on function public.create_protocol_with_demands(text, text[]) to authenticated;
grant execute on function public.update_protocol_with_demands(uuid, text, text[]) to authenticated;
