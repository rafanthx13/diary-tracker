-- Garante exatamente o terceiro grupo solicitado para o catálogo de tempo.
-- Esta migração também corrige instalações que receberam "Rotina Quarto"
-- com letras minúsculas ou a antiga categoria ARRUMAÇÃO.

update public.classifications
set category_id = null
where category_id in (
  select id from public.categories where upper(name) = 'ARRUMAÇÃO'
);

delete from public.categories
where upper(name) = 'ARRUMAÇÃO';

update public.categories
set name = 'ROTINA QUARTO', color = '#db2777'
where lower(name) = lower('Rotina Quarto');

insert into public.categories (name, color)
select 'ROTINA QUARTO', '#db2777'
where not exists (
  select 1 from public.categories where lower(name) = lower('ROTINA QUARTO')
);
