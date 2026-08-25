-- ============================================================
--  ELEVESQUAD — ATUALIZAÇÃO 11
--  Explorar squads + pedido de entrada
--  Rodar no SQL Editor do Supabase
-- ============================================================

-- 1. Pedidos de entrada
create table if not exists public.solicitacoes (
  id          uuid primary key default gen_random_uuid(),
  squad_id    uuid not null references public.squads(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  mensagem    text,
  status      text not null default 'pendente',   -- pendente | aprovado | recusado
  created_at  timestamptz not null default now()
);

create unique index if not exists solicitacao_uma_por_squad
  on public.solicitacoes (squad_id, user_id) where status = 'pendente';

create index if not exists idx_solicitacoes_squad on public.solicitacoes(squad_id);

-- 2. Aprovou, entrou
create or replace function public.trg_solicitacao_aprovada()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'aprovado' and coalesce(old.status, '') <> 'aprovado' then
    insert into public.squad_members (squad_id, user_id, papel, status)
    values (new.squad_id, new.user_id, 'membro', 'ativo')
    on conflict (squad_id, user_id) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists trg_solicitacao on public.solicitacoes;
create trigger trg_solicitacao after update on public.solicitacoes
  for each row execute function public.trg_solicitacao_aprovada();

-- 3. Vitrine: squads abertos, sem expor conteúdo interno
create or replace function public.explorar_squads()
returns table (
  id uuid, nome text, tipo squad_type, status squad_status,
  objetivo text, data_inicio date, data_fim date,
  organizador text, organizador_id uuid, organizador_avatar text,
  qtd_membros bigint, streak_atual int, pontos_total numeric,
  total_periodos int, periodos_concluidos bigint
) language sql security definer stable set search_path = public as $$
  select
    s.id, s.nome, s.tipo, s.status,
    case when s.status = 'rascunho' then s.objetivo else null end,
    s.data_inicio, s.data_fim,
    p.nome, p.id, p.avatar_url,
    (select count(*) from public.squad_members m
       where m.squad_id = s.id and m.status = 'ativo'),
    s.streak_atual, s.pontos_total, s.total_periodos,
    (select count(*) from public.squad_periods sp
       where sp.squad_id = s.id and sp.status = 'concluido')
  from public.squads s
  join public.profiles p on p.id = s.criado_por
  where s.status in ('rascunho', 'ativo')
  order by (s.status = 'rascunho') desc, s.data_inicio;
$$;

-- 4. Segurança
alter table public.solicitacoes enable row level security;

drop policy if exists "vejo solicitacoes" on public.solicitacoes;
create policy "vejo solicitacoes" on public.solicitacoes for select to authenticated
  using (user_id = auth.uid() or public.sou_criador(squad_id));

drop policy if exists "peco entrada" on public.solicitacoes;
create policy "peco entrada" on public.solicitacoes for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "respondo solicitacao" on public.solicitacoes;
create policy "respondo solicitacao" on public.solicitacoes for update to authenticated
  using (public.sou_criador(squad_id));

-- FIM
