-- ============================================================
--  SQUADPRAY — ATUALIZAÇÃO 5
--  Legenda obrigatória (200 caracteres) nas fotos semanais
--  Rodar no SQL Editor do Supabase
-- ============================================================

alter table public.weekly_photos drop constraint if exists fotos_legenda_min;
alter table public.weekly_photos
  add constraint fotos_legenda_min
  check (char_length(btrim(coalesce(legenda, ''))) >= 200) not valid;

-- FIM
