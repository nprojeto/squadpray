-- ============================================================
--  ELEVESQUAD — ATUALIZAÇÃO 8
--  Squad sem limite máximo de pessoas
--  Rodar no SQL Editor do Supabase
-- ============================================================

-- 1. Solta a trava de tamanho
alter table public.squads drop constraint if exists squads_tamanho_ok;
alter table public.squads
  add constraint squads_tamanho_ok check (min_membros >= 2);

alter table public.squads alter column max_membros set default 0;   -- 0 = sem limite
update public.squads set max_membros = 0;

-- 2. O gatilho deixa de barrar entradas
create or replace function public.check_max_membros()
returns trigger language plpgsql as $$
declare qtd int; lim int;
begin
  select max_membros into lim from public.squads where id = new.squad_id;
  if lim is null or lim <= 0 then
    return new;  -- sem limite
  end if;
  select count(*) into qtd from public.squad_members
    where squad_id = new.squad_id and status = 'ativo';
  if qtd >= lim then
    raise exception 'Este squad já atingiu o limite de % pessoas.', lim;
  end if;
  return new;
end $$;

-- FIM
