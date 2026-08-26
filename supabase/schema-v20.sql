-- ============================================================
--  SQUADPRAY — ATUALIZAÇÃO 20
--  Tour de boas-vindas
--  Rodar no SQL Editor do Supabase
-- ============================================================

alter table public.profiles add column if not exists tour_visto boolean not null default false;

-- quem já está na plataforma não precisa rever
update public.profiles set tour_visto = true
 where created_at < now() - interval '1 hour';

-- FIM
