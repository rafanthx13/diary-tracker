-- Correção para erro 42501: permission denied for table classifications.
-- Mantém o acesso privado: RLS continua restringindo cada linha ao dono autenticado.

grant usage on schema public to authenticated;
grant select, insert, update, delete
  on table public.categories, public.classifications, public.activities
  to authenticated;
