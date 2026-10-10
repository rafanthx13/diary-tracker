-- Importações de sono não possuem nota de qualidade; ela permanece opcional nesses registros.

alter table public.health_sleep_entries
  alter column quality_score drop not null;
