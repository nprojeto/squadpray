-- ============================================================
--  SQUADPRAY — ATUALIZAÇÃO 4
--  Perfil completo, rede de prayers e exclusão de squad
--  Rodar no SQL Editor do Supabase
-- ============================================================

-- 1. Campos novos do perfil
alter table public.profiles add column if not exists igreja text;
alter table public.profiles add column if not exists ministerios text;
alter table public.profiles add column if not exists data_nascimento date;
alter table public.profiles add column if not exists instagram text;
alter table public.profiles add column if not exists facebook text;
alter table public.profiles add column if not exists tiktok text;
alter table public.profiles add column if not exists youtube text;
alter table public.profiles add column if not exists perfil_publico boolean not null default true;

create index if not exists idx_profiles_busca on public.profiles (lower(nome));

-- 2. Pedido de exclusão do squad depois de iniciado
create table if not exists public.squad_exclusoes (
  id             uuid primary key default gen_random_uuid(),
  squad_id       uuid not null references public.squads(id) on delete cascade,
  solicitado_por uuid not null references public.profiles(id) on delete cascade,
  motivo         text,
  status         text not null default 'pendente',  -- pendente | rejeitado
  created_at     timestamptz not null default now()
);

create unique index if not exists exclusao_uma_por_squad
  on public.squad_exclusoes (squad_id) where status = 'pendente';

create table if not exists public.exclusao_votos (
  id           uuid primary key default gen_random_uuid(),
  exclusao_id  uuid not null references public.squad_exclusoes(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  aprovado     boolean not null,
  created_at   timestamptz not null default now(),
  unique (exclusao_id, user_id)
);

-- 3. Quando todos aprovarem, o squad é apagado de vez
create or replace function public.verificar_exclusao(p_exclusao uuid)
returns void language plpgsql security definer set search_path = public as $$
declare ex record; n_membros int; n_sim int; n_nao int;
begin
  select * into ex from public.squad_exclusoes where id = p_exclusao;
  if ex is null or ex.status <> 'pendente' then return; end if;

  select count(*) into n_membros
    from public.squad_members where squad_id = ex.squad_id and status = 'ativo';

  select count(*) filter (where aprovado), count(*) filter (where not aprovado)
    into n_sim, n_nao from public.exclusao_votos where exclusao_id = p_exclusao;

  if n_nao > 0 then
    update public.squad_exclusoes set status = 'rejeitado' where id = p_exclusao;
  elsif n_sim >= n_membros then
    delete from public.squads where id = ex.squad_id;
  end if;
end $$;

create or replace function public.trg_voto_exclusao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.verificar_exclusao(new.exclusao_id);
  return new;
end $$;

drop trigger if exists trg_exclusao on public.exclusao_votos;
create trigger trg_exclusao after insert or update on public.exclusao_votos
  for each row execute function public.trg_voto_exclusao();

-- 4. Busca de prayers na rede
create or replace function public.buscar_prayers(termo text)
returns table (
  id uuid, nome text, avatar_url text, bio text, igreja text,
  pontos_total numeric, perfil_publico boolean
) language sql security definer stable set search_path = public as $$
  select p.id, p.nome, p.avatar_url,
         case when p.perfil_publico then p.bio else null end,
         case when p.perfil_publico then p.igreja else null end,
         p.pontos_total, p.perfil_publico
  from public.profiles p
  where coalesce(termo, '') = ''
     or p.nome ilike '%' || termo || '%'
     or p.igreja ilike '%' || termo || '%'
  order by p.pontos_total desc, p.nome
  limit 40;
$$;

-- 5. Segurança
alter table public.squad_exclusoes enable row level security;
alter table public.exclusao_votos  enable row level security;

drop policy if exists "vejo exclusoes" on public.squad_exclusoes;
create policy "vejo exclusoes" on public.squad_exclusoes for select to authenticated
  using (public.sou_membro(squad_id));

drop policy if exists "peco exclusao" on public.squad_exclusoes;
create policy "peco exclusao" on public.squad_exclusoes for insert to authenticated
  with check (public.sou_membro(squad_id) and solicitado_por = auth.uid());

drop policy if exists "vejo votos" on public.exclusao_votos;
create policy "vejo votos" on public.exclusao_votos for select to authenticated using (true);

drop policy if exists "voto exclusao" on public.exclusao_votos;
create policy "voto exclusao" on public.exclusao_votos for insert to authenticated
  with check (user_id = auth.uid());

-- FIM
