-- Categorias são exclusivas do registro de tempo.
-- Tarefas não usam categorias.

alter table public.classifications alter column category_id drop not null;
alter table public.tasks drop column if exists category_id;

insert into public.categories (name, color) values
  ('TEMPO PERDIDO', '#9333ea'),
  ('WORK', '#2563eb')
on conflict do nothing;

-- Remove vínculos anteriores antes de aplicar a nova organização.
update public.classifications set category_id = null;

-- O catálogo de tempo. Algumas classificações ficam propositalmente sem categoria.
insert into public.classifications (category_id, name)
select category.id, defaults.name
from (
  values
    ('TEMPO PERDIDO', 'Klap'),
    ('TEMPO PERDIDO', 'SemiKlap'),
    ('TEMPO PERDIDO', 'Relax or Games'),
    ('TEMPO PERDIDO', 'Brawl'),
    ('WORK', 'TASK'),
    ('WORK', 'Book'),
    ('WORK', 'Corrrer'),
    ('WORK', 'Academia'),
    ('WORK', 'Arrumação PC')
) as defaults(category_name, name)
join public.categories as category on category.name = defaults.category_name
on conflict do nothing;

insert into public.classifications (name) values
  ('Mercado'),
  ('Arrumação Quarto'),
  ('Fazer Jantar'),
  ('Finalizar Dia'),
  ('Higiene'),
  ('Arrumar pra sair'),
  ('Next Day'),
  ('Jantar'),
  ('Almoçar'),
  ('Fazer Almoço'),
  ('Sair Casa'),
  ('Notes PC or Diary'),
  ('Obsidian Notes'),
  ('Conversa Vilma'),
  ('Tomar Café')
on conflict do nothing;

update public.classifications as classification
set category_id = category.id
from public.categories as category
where (category.name, classification.name) in (
  ('TEMPO PERDIDO', 'Klap'),
  ('TEMPO PERDIDO', 'SemiKlap'),
  ('TEMPO PERDIDO', 'Relax or Games'),
  ('TEMPO PERDIDO', 'Brawl'),
  ('WORK', 'TASK'),
  ('WORK', 'Book'),
  ('WORK', 'Corrrer'),
  ('WORK', 'Academia'),
  ('WORK', 'Arrumação PC')
);

-- Neste ponto existem duas categorias; ROTINA QUARTO é adicionada na migração 20260921030000.
delete from public.categories
where name not in ('TEMPO PERDIDO', 'WORK');
