-- Nova categoria do módulo de atividades temporizadas.

insert into public.categories (name, color)
values ('ROTINA QUARTO', '#db2777')
on conflict do nothing;
