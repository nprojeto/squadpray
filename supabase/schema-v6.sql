-- ============================================================
--  ELEVESQUAD — ATUALIZAÇÃO 6
--  Favoritos da rede
--  Rodar no SQL Editor do Supabase
-- ============================================================

create table if not exists public.favoritos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  alvo_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, alvo_id),
  constraint favorito_nao_eu check (user_id <> alvo_id)
);

create index if not exists idx_favoritos_user on public.favoritos(user_id);

alter table public.favoritos enable row level security;

drop policy if exists "vejo meus favoritos" on public.favoritos;
create policy "vejo meus favoritos" on public.favoritos for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "favorito" on public.favoritos;
create policy "favorito" on public.favoritos for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "desfavorito" on public.favoritos;
create policy "desfavorito" on public.favoritos for delete to authenticated
  using (user_id = auth.uid());

-- FIM

-- ============================================================
--  Mínimo de pessoas no squad: 2 (um casal em propósito)
-- ============================================================

alter table public.squads drop constraint if exists squads_tamanho_ok;
alter table public.squads
  add constraint squads_tamanho_ok check (min_membros >= 2 and max_membros <= 6);

alter table public.squads alter column min_membros set default 2;
update public.squads set min_membros = 2 where min_membros > 2 and status = 'rascunho';
