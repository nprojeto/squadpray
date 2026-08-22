-- ============================================================
--  VIGÍLIA — Plataforma de Streaks em Squads
--  Banco: Supabase / PostgreSQL
--  Rodar inteiro no SQL Editor do Supabase (uma vez só)
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. TIPOS
-- ============================================================

do $$ begin
  create type squad_type as enum (
    'leitura_biblica','livros','devocional','oracao','jejum','celebracao','gdc'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type squad_status as enum ('rascunho','ativo','concluido','cancelado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type member_status as enum ('ativo','saiu','removido');
exception when duplicate_object then null; end $$;

do $$ begin
  create type invite_status as enum ('pendente','aceito','recusado','aprovado','rejeitado','expirado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type day_status as enum ('aguardando','em_andamento','concluido','falhou');
exception when duplicate_object then null; end $$;

-- ============================================================
-- 2. PERFIS
-- ============================================================

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  nome          text not null,
  email         text not null,
  avatar_url    text,
  bio           text,
  timezone      text not null default 'America/Sao_Paulo',
  pontos_total  numeric(12,2) not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- cria o perfil automaticamente quando alguém se cadastra
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome, email, timezone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email,'@',1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'timezone','America/Sao_Paulo')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 3. SQUADS
-- ============================================================

create table if not exists public.squads (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  tipo            squad_type not null,
  objetivo        text,                          -- obrigatório p/ oração e jejum
  descricao       text,
  data_inicio     date not null,
  data_fim        date not null,
  status          squad_status not null default 'rascunho',
  criado_por      uuid not null references public.profiles(id) on delete cascade,
  min_membros     int not null default 3,
  max_membros     int not null default 6,
  -- streak e pontos
  streak_atual    int not null default 0,
  streak_recorde  int not null default 0,
  selo_dourado    boolean not null default false, -- true a partir de 7 dias seguidos
  pontos_total    numeric(12,2) not null default 0,
  total_periodos  int not null default 0,         -- dias (diário) ou semanas (semanal)
  valor_periodo   numeric(12,4) not null default 0,-- 100 / total_periodos
  codigo_convite  text unique not null default upper(substr(md5(random()::text),1,6)),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint squads_datas_ok check (data_fim >= data_inicio),
  constraint squads_tamanho_ok check (min_membros >= 3 and max_membros <= 6),
  constraint squads_objetivo_ok check (
    tipo not in ('oracao','jejum') or (objetivo is not null and length(btrim(objetivo)) >= 10)
  )
);

-- REGRA: cada pessoa cria no máximo 1 squad
create unique index if not exists squads_um_por_criador
  on public.squads (criado_por)
  where status in ('rascunho','ativo');

create index if not exists idx_squads_status on public.squads(status);
create index if not exists idx_squads_tipo on public.squads(tipo);

-- helper: o tipo é semanal?
create or replace function public.is_semanal(t squad_type)
returns boolean language sql immutable as $$
  select t in ('celebracao','gdc');
$$;

-- ============================================================
-- 4. MEMBROS
-- ============================================================

create table if not exists public.squad_members (
  id           uuid primary key default gen_random_uuid(),
  squad_id     uuid not null references public.squads(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  papel        text not null default 'membro',    -- 'criador' | 'membro'
  status       member_status not null default 'ativo',
  ordem_escala int,
  entrou_em    timestamptz not null default now(),
  unique (squad_id, user_id)
);

create index if not exists idx_members_user on public.squad_members(user_id);
create index if not exists idx_members_squad on public.squad_members(squad_id);

-- função sem recursão de RLS: sou membro deste squad?
create or replace function public.sou_membro(p_squad uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.squad_members
    where squad_id = p_squad and user_id = auth.uid() and status = 'ativo'
  );
$$;

create or replace function public.sou_criador(p_squad uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.squads where id = p_squad and criado_por = auth.uid());
$$;

-- trava de tamanho máximo
create or replace function public.check_max_membros()
returns trigger language plpgsql as $$
declare qtd int; lim int;
begin
  select max_membros into lim from public.squads where id = new.squad_id;
  select count(*) into qtd from public.squad_members
    where squad_id = new.squad_id and status = 'ativo';
  if qtd >= lim then
    raise exception 'Este squad já atingiu o limite de % pessoas.', lim;
  end if;
  return new;
end $$;

drop trigger if exists trg_max_membros on public.squad_members;
create trigger trg_max_membros
  before insert on public.squad_members
  for each row execute function public.check_max_membros();

-- ============================================================
-- 5. CONVITES (criador convida -> pessoa aceita -> todos aprovam)
-- ============================================================

create table if not exists public.squad_invites (
  id           uuid primary key default gen_random_uuid(),
  squad_id     uuid not null references public.squads(id) on delete cascade,
  email        text not null,
  user_id      uuid references public.profiles(id) on delete set null,
  convidado_por uuid not null references public.profiles(id) on delete cascade,
  status       invite_status not null default 'pendente',
  aceito_em    timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_invites_email on public.squad_invites(lower(email));
create index if not exists idx_invites_squad on public.squad_invites(squad_id);

create table if not exists public.invite_approvals (
  id         uuid primary key default gen_random_uuid(),
  invite_id  uuid not null references public.squad_invites(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  aprovado   boolean not null,
  created_at timestamptz not null default now(),
  unique (invite_id, user_id)
);

-- ============================================================
-- 6. PERÍODOS (dias para squads diários / semanas para semanais)
-- ============================================================

create table if not exists public.squad_periods (
  id            uuid primary key default gen_random_uuid(),
  squad_id      uuid not null references public.squads(id) on delete cascade,
  indice        int not null,                 -- 1, 2, 3...
  data_inicio   date not null,                -- dia (diário) ou segunda-feira (semanal)
  data_fim      date not null,                -- igual ao início (diário) ou domingo (semanal)
  autor_id      uuid references public.profiles(id) on delete set null, -- escala rotativa
  status        day_status not null default 'aguardando',
  pontos        numeric(12,4) not null default 0,
  concluido_em  timestamptz,
  unique (squad_id, indice)
);

create index if not exists idx_periods_squad on public.squad_periods(squad_id, data_inicio);
create index if not exists idx_periods_autor on public.squad_periods(autor_id);

-- ============================================================
-- 7. ARTIGOS + REAÇÕES (squads diários)
-- ============================================================

create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  squad_id    uuid not null references public.squads(id) on delete cascade,
  period_id   uuid not null references public.squad_periods(id) on delete cascade,
  autor_id    uuid not null references public.profiles(id) on delete cascade,
  titulo      text,
  referencia  text,                              -- ex.: "João 3:16" ou capítulo do livro
  conteudo    text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint posts_min_200 check (char_length(btrim(conteudo)) >= 200),
  unique (period_id)
);

create index if not exists idx_posts_squad on public.posts(squad_id, created_at desc);

-- catálogo de emojis cristãos (renderizados como SVG no app)
create table if not exists public.reaction_emojis (
  codigo    text primary key,
  nome      text not null,
  descricao text,
  ordem     int not null default 0,
  ativo     boolean not null default true
);

insert into public.reaction_emojis (codigo, nome, descricao) values
  ('amem',    'Amém',       'Concordo e recebo'),
  ('oracao',  'Orando',     'Estou orando por isso'),
  ('cruz',    'Cruz',       'Cristo no centro'),
  ('pomba',   'Pomba',      'Paz e Espírito Santo'),
  ('fogo',    'Fogo',       'Avivamento'),
  ('luz',     'Luz',        'Isso me iluminou'),
  ('coroa',   'Coroa',      'Glória ao Rei'),
  ('semente', 'Semente',    'Vou guardar isso')
on conflict (codigo) do nothing;

update public.reaction_emojis set ordem = case codigo
  when 'amem' then 1 when 'oracao' then 2 when 'cruz' then 3 when 'pomba' then 4
  when 'fogo' then 5 when 'luz' then 6 when 'coroa' then 7 when 'semente' then 8 end;

create table if not exists public.post_reactions (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  squad_id   uuid not null references public.squads(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  emoji      text not null references public.reaction_emojis(codigo),
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists idx_reactions_post on public.post_reactions(post_id);

-- ============================================================
-- 8. FOTOS SEMANAIS + CONFIRMAÇÕES (celebração e GDC)
-- ============================================================

create table if not exists public.weekly_photos (
  id         uuid primary key default gen_random_uuid(),
  squad_id   uuid not null references public.squads(id) on delete cascade,
  period_id  uuid not null references public.squad_periods(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  foto_url   text not null,
  legenda    text,
  created_at timestamptz not null default now(),
  unique (period_id, user_id)
);

create index if not exists idx_photos_squad on public.weekly_photos(squad_id, created_at desc);

create table if not exists public.photo_confirmations (
  id         uuid primary key default gen_random_uuid(),
  photo_id   uuid not null references public.weekly_photos(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (photo_id, user_id)
);

-- ============================================================
-- 9. EXTRATO DE PONTOS
-- ============================================================

create table if not exists public.points_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  squad_id   uuid not null references public.squads(id) on delete cascade,
  period_id  uuid references public.squad_periods(id) on delete cascade,
  pontos     numeric(12,4) not null,
  motivo     text not null,
  created_at timestamptz not null default now(),
  unique (user_id, period_id)
);

create index if not exists idx_ledger_user on public.points_ledger(user_id, created_at desc);

-- ============================================================
-- 10. NOTIFICAÇÕES
-- ============================================================

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  titulo     text not null,
  mensagem   text not null,
  link       text,
  lida       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notif_user on public.notifications(user_id, lida, created_at desc);

-- ============================================================
-- 11. MOTOR: ESCALA, STREAK E PONTUAÇÃO
-- ============================================================

-- Gera todos os períodos + a escala rotativa no momento da ativação
create or replace function public.gerar_periodos(p_squad uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  s record; membros uuid[]; n int; i int := 1;
  d_ini date; d_fim date; cursor_date date; total int;
begin
  select * into s from public.squads where id = p_squad;
  if s is null then raise exception 'Squad não encontrado.'; end if;

  select array_agg(user_id order by entrou_em) into membros
    from public.squad_members where squad_id = p_squad and status = 'ativo';
  n := coalesce(array_length(membros,1),0);
  if n < s.min_membros then
    raise exception 'São necessárias pelo menos % pessoas para começar.', s.min_membros;
  end if;

  delete from public.squad_periods where squad_id = p_squad;

  if public.is_semanal(s.tipo) then
    -- ciclo semanal: sempre segunda -> domingo
    cursor_date := s.data_inicio - ((extract(isodow from s.data_inicio)::int - 1));
    if cursor_date < s.data_inicio then
      cursor_date := cursor_date + 7;
    end if;
    while cursor_date <= s.data_fim loop
      d_ini := cursor_date; d_fim := cursor_date + 6;
      insert into public.squad_periods (squad_id, indice, data_inicio, data_fim, autor_id)
      values (p_squad, i, d_ini, d_fim, null);
      i := i + 1; cursor_date := cursor_date + 7;
    end loop;
  else
    -- ciclo diário com escala rotativa
    cursor_date := s.data_inicio;
    while cursor_date <= s.data_fim loop
      insert into public.squad_periods (squad_id, indice, data_inicio, data_fim, autor_id)
      values (p_squad, i, cursor_date, cursor_date, membros[((i - 1) % n) + 1]);
      i := i + 1; cursor_date := cursor_date + 1;
    end loop;
  end if;

  total := i - 1;
  update public.squads
     set total_periodos = total,
         valor_periodo  = case when total > 0 then round(100.0 / total, 4) else 0 end,
         status = 'ativo',
         updated_at = now()
   where id = p_squad;
end $$;

-- Avalia um período: todos cumpriram? -> pontua, soma streak, aplica selo
create or replace function public.avaliar_periodo(p_period uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  p record; s record; membros uuid[]; n int;
  qtd_reacoes int; tem_post boolean;
  qtd_fotos int; fotos_ok int; completo boolean := false;
  m uuid; res jsonb;
begin
  select * into p from public.squad_periods where id = p_period;
  if p is null then return jsonb_build_object('erro','Período não encontrado'); end if;
  select * into s from public.squads where id = p.squad_id;

  select array_agg(user_id) into membros
    from public.squad_members where squad_id = p.squad_id and status = 'ativo';
  n := coalesce(array_length(membros,1),0);
  if n = 0 then return jsonb_build_object('erro','Squad sem membros'); end if;

  if public.is_semanal(s.tipo) then
    -- semanal: cada membro envia 1 foto e TODOS os outros confirmam cada foto
    select count(*) into qtd_fotos from public.weekly_photos where period_id = p_period;
    select count(*) into fotos_ok from (
      select wp.id from public.weekly_photos wp
      join public.photo_confirmations pc on pc.photo_id = wp.id
      where wp.period_id = p_period
      group by wp.id
      having count(distinct pc.user_id) >= n - 1
    ) t;
    completo := (qtd_fotos = n and fotos_ok = n);
  else
    -- diário: existe o artigo do autor da escala + todos os outros reagiram
    select exists(select 1 from public.posts where period_id = p_period) into tem_post;
    select count(distinct user_id) into qtd_reacoes
      from public.post_reactions pr
      join public.posts po on po.id = pr.post_id
      where po.period_id = p_period and pr.user_id <> po.autor_id;
    completo := tem_post and qtd_reacoes >= n - 1;
  end if;

  if completo and p.status <> 'concluido' then
    update public.squad_periods
       set status = 'concluido', pontos = s.valor_periodo, concluido_em = now()
     where id = p_period;

    -- pontos para cada membro (acumulativos, nunca são perdidos)
    foreach m in array membros loop
      insert into public.points_ledger (user_id, squad_id, period_id, pontos, motivo)
      values (m, p.squad_id, p_period, s.valor_periodo,
              case when public.is_semanal(s.tipo) then 'Semana cumprida' else 'Dia cumprido' end)
      on conflict (user_id, period_id) do nothing;

      update public.profiles
         set pontos_total = pontos_total + s.valor_periodo, updated_at = now()
       where id = m;
    end loop;

    update public.squads
       set streak_atual   = streak_atual + 1,
           streak_recorde = greatest(streak_recorde, streak_atual + 1),
           selo_dourado   = (streak_atual + 1) >= 7,
           pontos_total   = pontos_total + s.valor_periodo,
           updated_at     = now()
     where id = p.squad_id;
  end if;

  select jsonb_build_object(
    'completo', completo,
    'streak', sq.streak_atual,
    'selo_dourado', sq.selo_dourado,
    'pontos_squad', sq.pontos_total
  ) into res from public.squads sq where sq.id = p.squad_id;

  return res;
end $$;

-- Fecha períodos vencidos: quem não cumpriu falha e ZERA o streak do squad
create or replace function public.fechar_periodos_vencidos()
returns int language plpgsql security definer set search_path = public as $$
declare p record; qtd int := 0; limite date;
begin
  for p in
    select sp.*, s.tipo
      from public.squad_periods sp
      join public.squads s on s.id = sp.squad_id
     where sp.status in ('aguardando','em_andamento')
       and s.status = 'ativo'
  loop
    -- margem de 1 dia: cobre todos os fusos horários dos membros
    limite := p.data_fim + 1;
    if current_date > limite then
      perform public.avaliar_periodo(p.id);
      if (select status from public.squad_periods where id = p.id) <> 'concluido' then
        update public.squad_periods set status = 'falhou' where id = p.id;
        update public.squads
           set streak_atual = 0, selo_dourado = false, updated_at = now()
         where id = p.squad_id;
        qtd := qtd + 1;
      end if;
    end if;
  end loop;

  -- encerra squads que chegaram ao fim
  update public.squads set status = 'concluido', updated_at = now()
   where status = 'ativo' and data_fim < current_date - 1;

  return qtd;
end $$;

-- reavalia automaticamente ao reagir / postar / confirmar foto
create or replace function public.trg_reavaliar()
returns trigger language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  if tg_table_name = 'post_reactions' then
    select period_id into pid from public.posts where id = new.post_id;
  elsif tg_table_name = 'posts' then
    pid := new.period_id;
  elsif tg_table_name = 'photo_confirmations' then
    select period_id into pid from public.weekly_photos where id = new.photo_id;
  elsif tg_table_name = 'weekly_photos' then
    pid := new.period_id;
  end if;
  if pid is not null then perform public.avaliar_periodo(pid); end if;
  return new;
end $$;

drop trigger if exists trg_post_aval on public.posts;
create trigger trg_post_aval after insert on public.posts
  for each row execute function public.trg_reavaliar();

drop trigger if exists trg_reacao_aval on public.post_reactions;
create trigger trg_reacao_aval after insert on public.post_reactions
  for each row execute function public.trg_reavaliar();

drop trigger if exists trg_foto_aval on public.weekly_photos;
create trigger trg_foto_aval after insert on public.weekly_photos
  for each row execute function public.trg_reavaliar();

drop trigger if exists trg_confirm_aval on public.photo_confirmations;
create trigger trg_confirm_aval after insert on public.photo_confirmations
  for each row execute function public.trg_reavaliar();

-- aprova convite quando TODOS os membros aprovarem
create or replace function public.trg_check_aprovacao()
returns trigger language plpgsql security definer set search_path = public as $$
declare inv record; n_membros int; n_aprov int; n_reject int;
begin
  select * into inv from public.squad_invites where id = new.invite_id;
  select count(*) into n_membros from public.squad_members
    where squad_id = inv.squad_id and status = 'ativo';
  select count(*) filter (where aprovado), count(*) filter (where not aprovado)
    into n_aprov, n_reject from public.invite_approvals where invite_id = new.invite_id;

  if n_reject > 0 then
    update public.squad_invites set status = 'rejeitado' where id = inv.id;
  elsif n_aprov >= n_membros then
    update public.squad_invites set status = 'aprovado' where id = inv.id;
    insert into public.squad_members (squad_id, user_id, papel, status)
    values (inv.squad_id, inv.user_id, 'membro', 'ativo')
    on conflict (squad_id, user_id) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists trg_aprovacao on public.invite_approvals;
create trigger trg_aprovacao after insert on public.invite_approvals
  for each row execute function public.trg_check_aprovacao();

-- criador vira membro automaticamente
create or replace function public.trg_criador_membro()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.squad_members (squad_id, user_id, papel, status, ordem_escala)
  values (new.id, new.criado_por, 'criador', 'ativo', 1)
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists trg_criador on public.squads;
create trigger trg_criador after insert on public.squads
  for each row execute function public.trg_criador_membro();

-- ============================================================
-- 12. VIEWS DE APOIO
-- ============================================================

create or replace view public.v_squad_resumo as
select
  s.id, s.nome, s.tipo, s.objetivo, s.status, s.data_inicio, s.data_fim,
  s.streak_atual, s.streak_recorde, s.selo_dourado, s.pontos_total,
  s.total_periodos, s.valor_periodo, s.codigo_convite, s.criado_por,
  (select count(*) from public.squad_members m
     where m.squad_id = s.id and m.status='ativo') as qtd_membros,
  (select count(*) from public.squad_periods p
     where p.squad_id = s.id and p.status='concluido') as periodos_concluidos
from public.squads s;

-- ============================================================
-- 13. STORAGE (galeria de fotos)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('galeria','galeria', true)
on conflict (id) do nothing;

drop policy if exists "galeria leitura" on storage.objects;
create policy "galeria leitura" on storage.objects
  for select using (bucket_id = 'galeria');

drop policy if exists "galeria envio" on storage.objects;
create policy "galeria envio" on storage.objects
  for insert to authenticated with check (bucket_id = 'galeria');

drop policy if exists "galeria remover" on storage.objects;
create policy "galeria remover" on storage.objects
  for delete to authenticated using (bucket_id = 'galeria' and owner = auth.uid());

-- ============================================================
-- 14. SEGURANÇA (RLS)
-- ============================================================

alter table public.profiles            enable row level security;
alter table public.squads              enable row level security;
alter table public.squad_members       enable row level security;
alter table public.squad_invites       enable row level security;
alter table public.invite_approvals    enable row level security;
alter table public.squad_periods       enable row level security;
alter table public.posts               enable row level security;
alter table public.post_reactions      enable row level security;
alter table public.weekly_photos       enable row level security;
alter table public.photo_confirmations enable row level security;
alter table public.points_ledger       enable row level security;
alter table public.notifications       enable row level security;
alter table public.reaction_emojis     enable row level security;

drop policy if exists "perfis visiveis" on public.profiles;
create policy "perfis visiveis" on public.profiles for select to authenticated using (true);
drop policy if exists "edito meu perfil" on public.profiles;
create policy "edito meu perfil" on public.profiles for update to authenticated using (id = auth.uid());

drop policy if exists "vejo meus squads" on public.squads;
create policy "vejo meus squads" on public.squads for select to authenticated
  using (criado_por = auth.uid() or public.sou_membro(id));
drop policy if exists "crio squad" on public.squads;
create policy "crio squad" on public.squads for insert to authenticated
  with check (criado_por = auth.uid());
drop policy if exists "edito meu squad" on public.squads;
create policy "edito meu squad" on public.squads for update to authenticated
  using (criado_por = auth.uid());
drop policy if exists "apago meu squad" on public.squads;
create policy "apago meu squad" on public.squads for delete to authenticated
  using (criado_por = auth.uid() and status = 'rascunho');

drop policy if exists "vejo membros" on public.squad_members;
create policy "vejo membros" on public.squad_members for select to authenticated
  using (user_id = auth.uid() or public.sou_membro(squad_id));
drop policy if exists "saio do squad" on public.squad_members;
create policy "saio do squad" on public.squad_members for update to authenticated
  using (user_id = auth.uid() or public.sou_criador(squad_id));

drop policy if exists "vejo convites" on public.squad_invites;
create policy "vejo convites" on public.squad_invites for select to authenticated
  using (user_id = auth.uid() or public.sou_membro(squad_id)
         or lower(email) = lower(coalesce(auth.jwt()->>'email','')));
drop policy if exists "convido" on public.squad_invites;
create policy "convido" on public.squad_invites for insert to authenticated
  with check (public.sou_criador(squad_id));
drop policy if exists "respondo convite" on public.squad_invites;
create policy "respondo convite" on public.squad_invites for update to authenticated
  using (user_id = auth.uid() or lower(email) = lower(coalesce(auth.jwt()->>'email','')));

drop policy if exists "vejo aprovacoes" on public.invite_approvals;
create policy "vejo aprovacoes" on public.invite_approvals for select to authenticated using (true);
drop policy if exists "aprovo" on public.invite_approvals;
create policy "aprovo" on public.invite_approvals for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "vejo periodos" on public.squad_periods;
create policy "vejo periodos" on public.squad_periods for select to authenticated
  using (public.sou_membro(squad_id));

drop policy if exists "vejo posts" on public.posts;
create policy "vejo posts" on public.posts for select to authenticated
  using (public.sou_membro(squad_id));
drop policy if exists "escrevo post" on public.posts;
create policy "escrevo post" on public.posts for insert to authenticated
  with check (autor_id = auth.uid() and public.sou_membro(squad_id));
drop policy if exists "edito meu post" on public.posts;
create policy "edito meu post" on public.posts for update to authenticated
  using (autor_id = auth.uid());

drop policy if exists "vejo reacoes" on public.post_reactions;
create policy "vejo reacoes" on public.post_reactions for select to authenticated
  using (public.sou_membro(squad_id));
drop policy if exists "reajo" on public.post_reactions;
create policy "reajo" on public.post_reactions for insert to authenticated
  with check (user_id = auth.uid() and public.sou_membro(squad_id));

drop policy if exists "vejo fotos" on public.weekly_photos;
create policy "vejo fotos" on public.weekly_photos for select to authenticated
  using (public.sou_membro(squad_id));
drop policy if exists "envio foto" on public.weekly_photos;
create policy "envio foto" on public.weekly_photos for insert to authenticated
  with check (user_id = auth.uid() and public.sou_membro(squad_id));

drop policy if exists "vejo confirmacoes" on public.photo_confirmations;
create policy "vejo confirmacoes" on public.photo_confirmations for select to authenticated using (true);
drop policy if exists "confirmo foto" on public.photo_confirmations;
create policy "confirmo foto" on public.photo_confirmations for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "vejo meus pontos" on public.points_ledger;
create policy "vejo meus pontos" on public.points_ledger for select to authenticated
  using (user_id = auth.uid() or public.sou_membro(squad_id));

drop policy if exists "vejo notificacoes" on public.notifications;
create policy "vejo notificacoes" on public.notifications for select to authenticated
  using (user_id = auth.uid());
drop policy if exists "marco lida" on public.notifications;
create policy "marco lida" on public.notifications for update to authenticated
  using (user_id = auth.uid());

drop policy if exists "vejo emojis" on public.reaction_emojis;
create policy "vejo emojis" on public.reaction_emojis for select to authenticated using (true);

-- ============================================================
-- FIM
-- ============================================================
