-- O dia do diário vira às 05:00 no fuso de São Paulo.
-- Assim, atividades iniciadas entre 00:00 e 04:59 pertencem ao dia anterior.

alter table public.activities
  add column if not exists diary_date date;

update public.activities
set diary_date = ((started_at at time zone 'America/Sao_Paulo') - interval '5 hours')::date
where diary_date is null;

alter table public.activities
  alter column diary_date set not null;

create index if not exists activities_user_diary_date_idx
  on public.activities (user_id, diary_date, started_at);

create or replace function public.set_activity_diary_date()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.diary_date := ((new.started_at at time zone 'America/Sao_Paulo') - interval '5 hours')::date;
  return new;
end;
$$;

drop trigger if exists activities_set_diary_date on public.activities;
create trigger activities_set_diary_date
before insert or update of started_at on public.activities
for each row execute procedure public.set_activity_diary_date();
