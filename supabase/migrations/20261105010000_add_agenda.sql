-- Módulo Agenda: ciclos pessoais de 24 horas divididos em intervalos ordenados.

create table public.agendas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 100),
  day_starts_at smallint not null check (day_starts_at >= 0 and day_starts_at < 1440),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.agenda_intervals (
  id uuid primary key default gen_random_uuid(),
  agenda_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 300),
  color text not null check (color in ('emerald', 'blue', 'violet', 'amber', 'rose', 'cyan', 'orange', 'lime')),
  sort_order smallint not null check (sort_order >= 0 and sort_order < 100),
  starts_at smallint not null check (starts_at >= 0 and starts_at < 1440),
  ends_at smallint not null check (ends_at > starts_at and ends_at <= 1440),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agenda_intervals_agenda_user_fk
    foreign key (agenda_id, user_id)
    references public.agendas(id, user_id)
    on delete cascade,
  unique (agenda_id, sort_order)
);

create index agendas_user_updated_idx on public.agendas (user_id, updated_at desc);
create index agenda_intervals_agenda_order_idx on public.agenda_intervals (agenda_id, sort_order);

create trigger agendas_set_updated_at
before update on public.agendas
for each row execute procedure public.set_updated_at();

create trigger agenda_intervals_set_updated_at
before update on public.agenda_intervals
for each row execute procedure public.set_updated_at();

alter table public.agendas enable row level security;
alter table public.agenda_intervals enable row level security;

revoke all on public.agendas, public.agenda_intervals from anon;
grant select, insert, update, delete on public.agendas, public.agenda_intervals to authenticated;

create policy "users_select_own_agendas" on public.agendas for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users_insert_own_agendas" on public.agendas for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users_update_own_agendas" on public.agendas for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users_delete_own_agendas" on public.agendas for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "users_select_own_agenda_intervals" on public.agenda_intervals for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users_insert_own_agenda_intervals" on public.agenda_intervals for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users_update_own_agenda_intervals" on public.agenda_intervals for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users_delete_own_agenda_intervals" on public.agenda_intervals for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Recebe apenas os finais relativos ao início do dia. A função monta os inícios,
-- valida que não existem lacunas e garante que o último intervalo encerra em 24h.
create or replace function public.save_agenda_with_intervals(
  p_agenda_id uuid,
  p_title text,
  p_day_starts_at smallint,
  p_intervals jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_agenda_id uuid;
  interval_item jsonb;
  interval_title text;
  interval_color text;
  interval_end smallint;
  interval_start smallint := 0;
  interval_order integer := 0;
begin
  if auth.uid() is null then raise exception 'Usuário não autenticado.'; end if;
  if char_length(trim(p_title)) not between 1 and 100 then raise exception 'Título inválido.'; end if;
  if p_day_starts_at < 0 or p_day_starts_at >= 1440 then raise exception 'Horário inicial inválido.'; end if;
  if jsonb_typeof(p_intervals) <> 'array' or jsonb_array_length(p_intervals) not between 1 and 100 then
    raise exception 'Informe entre 1 e 100 intervalos.';
  end if;

  if p_agenda_id is null then
    insert into public.agendas (user_id, title, day_starts_at)
    values (auth.uid(), trim(p_title), p_day_starts_at)
    returning id into v_agenda_id;
  else
    update public.agendas set title = trim(p_title), day_starts_at = p_day_starts_at
    where id = p_agenda_id and user_id = auth.uid()
    returning id into v_agenda_id;
    if v_agenda_id is null then raise exception 'Agenda não encontrada.'; end if;
    delete from public.agenda_intervals where agenda_id = v_agenda_id and user_id = auth.uid();
  end if;

  for interval_item in select value from jsonb_array_elements(p_intervals) loop
    interval_title := trim(coalesce(interval_item->>'title', ''));
    interval_color := interval_item->>'color';
    interval_end := (interval_item->>'endOffset')::smallint;
    if char_length(interval_title) not between 1 and 300 then raise exception 'Atividade inválida.'; end if;
    if interval_color not in ('emerald', 'blue', 'violet', 'amber', 'rose', 'cyan', 'orange', 'lime') then raise exception 'Cor inválida.'; end if;
    if interval_end <= interval_start or interval_end > 1440 then raise exception 'Os horários dos intervalos são inválidos.'; end if;
    insert into public.agenda_intervals (agenda_id, user_id, title, color, sort_order, starts_at, ends_at)
    values (v_agenda_id, auth.uid(), interval_title, interval_color, interval_order, interval_start, interval_end);
    interval_start := interval_end;
    interval_order := interval_order + 1;
  end loop;

  if interval_start <> 1440 then raise exception 'A agenda deve fechar exatamente 24 horas após o início.'; end if;
  return v_agenda_id;
end;
$$;

revoke all on function public.save_agenda_with_intervals(uuid, text, smallint, jsonb) from public, anon;
grant execute on function public.save_agenda_with_intervals(uuid, text, smallint, jsonb) to authenticated;
