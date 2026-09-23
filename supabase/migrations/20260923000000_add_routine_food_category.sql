-- Categoria adicional para classificar atividades de rotina alimentar.

insert into public.categories (name, color)
values ('ROUTINE FOOD', '#ea580c')
on conflict do nothing;
