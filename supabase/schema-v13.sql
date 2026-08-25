-- ============================================================
--  ELEVESQUAD — ATUALIZAÇÃO 13
--  Conquistas completas + streak individual + concessão automática
--  Rodar inteiro no SQL Editor do Supabase
-- ============================================================

-- ------------------------------------------------------------
-- 1. Campos novos
-- ------------------------------------------------------------
alter table public.conquistas add column if not exists sub      text;
alter table public.conquistas add column if not exists classe   text;
alter table public.conquistas add column if not exists estrelas int not null default 1;

alter table public.profiles add column if not exists streak_individual        int not null default 0;
alter table public.profiles add column if not exists melhor_streak_individual int not null default 0;
alter table public.profiles add column if not exists ultimo_dia_individual    date;
alter table public.profiles add column if not exists dias_cumpridos_total     int not null default 0;

-- registro de cada dia que a pessoa cumpriu a parte dela
create table if not exists public.dias_cumpridos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  squad_id   uuid not null references public.squads(id) on delete cascade,
  period_id  uuid not null references public.squad_periods(id) on delete cascade,
  data       date not null,
  created_at timestamptz not null default now(),
  unique (user_id, period_id)
);

create index if not exists idx_dias_user on public.dias_cumpridos(user_id, data);

alter table public.dias_cumpridos enable row level security;
drop policy if exists "vejo meus dias" on public.dias_cumpridos;
create policy "vejo meus dias" on public.dias_cumpridos for select to authenticated
  using (user_id = auth.uid() or public.sou_membro(squad_id) or public.sou_admin());

-- o selo antigo trocou de nome
delete from public.conquistas_usuario where codigo = 'plantando_alvo_novo';
delete from public.conquistas         where codigo = 'plantando_alvo_novo';

-- ------------------------------------------------------------
-- 2. Catálogo definitivo
-- ------------------------------------------------------------
insert into public.conquistas (codigo, titulo, sub, regra, classe, estrelas, ordem, frase) values
 ('zerando_capitulos',     'Zerando Capítulos',      'Cada capítulo: algo novo gerado em nós.',        'Primeiro Squad de Leitura de Livro concluído',                        'vermelha', 1,  1, ''),
 ('no_secreto',            'No Secreto',             'Antes de tudo: oração.',                         'Primeiro Squad de Oração concluído',                                  'vermelha', 1,  2, ''),
 ('a_mesa',                'A Mesa',                 'Ninguém faz nada grande sozinho.',               'Completou 10 Squads com mais de 50 amigos diferentes',                'azul',     5,  3, ''),
 ('aprovados_pelo_ceu',    'Aprovados pelo Céu',     'Toda grande história começa com um sim.',        '100 dias cumpridos',                                                  'verde',    2,  4, ''),
 ('incendiando_tudo',      'Incendiando Tudo',       'Uma faísca de cada vez.',                        'Criou e finalizou 3 Squads',                                          'laranja',  4,  5, ''),
 ('que_galera_boa',        'Que Galera Boa!',        'Juntos a gente chega mais longe.',               'Squad com mais de 5 amigos finalizado com 100% de streak',            'azul',     5,  6, ''),
 ('mestre_da_palavra',     'Mestre da Palavra',      'Mais que aprender: viver.',                      'Primeiro Squad de Leitura Bíblica concluído',                         'vermelha', 1,  7, ''),
 ('buscando_a_lenha',      'Buscando a Lenha',       'Só mantém o fogo quem coloca lenha.',            'Primeiro Squad de GDC concluído',                                     'vermelha', 1,  8, ''),
 ('mantendo_aceso',        'Mantendo Aceso',         'Um dia de cada vez, todo dia.',                  'Iniciou um Squad logo na sequência de outro',                         'roxa',     3,  9, ''),
 ('plantando_algo_novo',   'Plantando Algo Novo',    'Toda mudança começa pequena.',                   'Completou 1 Squad criado por você e 2 em que foi convidado',          'verde',    2, 10, ''),
 ('de_armadura_completa',  'De Armadura Completa',   'Menos distração: mais propósito!',               'Participou de Squads de todas as práticas',                           'azul',     5, 11, ''),
 ('o_foco_e_jesus',        'O Foco é Jesus!',        'Deus permanece, quem muda sou eu.',              'Primeiro Squad de Jejum concluído',                                   'vermelha', 1, 12, ''),
 ('constantes',            'Constantes',             'Constância também é conquista.',                 '50 dias cumpridos',                                                   'verde',    2, 13, ''),
 ('dupla_retete',          'Dupla Reteté',           'Melhor ser dois do que um.',                     'Primeiro Squad em dupla concluído',                                   'verde',    2, 14, ''),
 ('enraizados',            'Enraizados',             'Quem cria raiz, não vive de fase.',              'Primeiro Squad de Devocional concluído',                              'vermelha', 1, 15, ''),
 ('da_galera',             'Da Galera',              'Sabedoria é ter amigos parecidos com Jesus.',    'Aceitou convite de 5 Squads',                                         'roxa',     3, 16, ''),
 ('ninguem_sozinho',       'Ninguém Sozinho',        'Se é pra chegar: bora chegar junto.',            'Fez mais de 80 convites para amigos',                                 'azul',     5, 17, ''),
 ('tudo_comeca_na_semente','Tudo Começa na Semente', 'Plantando sementes por aí.',                     'Primeiro Squad de Celebração concluído',                              'vermelha', 1, 18, '')
on conflict (codigo) do update
  set titulo = excluded.titulo, sub = excluded.sub, regra = excluded.regra,
      classe = excluded.classe, estrelas = excluded.estrelas, ordem = excluded.ordem;

update public.conquistas set frase = sub where coalesce(frase, '') = '';

-- ------------------------------------------------------------
-- 3. Streak individual (não zera ao trocar de squad)
--    Tolerância de 7 dias sem cumprir nada.
-- ------------------------------------------------------------
create or replace function public.marcar_dia_individual(p_user uuid, p_data date)
returns void language plpgsql security definer set search_path = public as $$
declare u record; folga int := 7;
begin
  select streak_individual, melhor_streak_individual, ultimo_dia_individual
    into u from public.profiles where id = p_user;
  if u is null then return; end if;

  if u.ultimo_dia_individual is null then
    update public.profiles
       set streak_individual = 1,
           melhor_streak_individual = greatest(melhor_streak_individual, 1),
           ultimo_dia_individual = p_data
     where id = p_user;

  elsif p_data <= u.ultimo_dia_individual then
    return;                                   -- já contou esse dia

  elsif p_data - u.ultimo_dia_individual <= folga then
    update public.profiles
       set streak_individual = streak_individual + 1,
           melhor_streak_individual = greatest(melhor_streak_individual, streak_individual + 1),
           ultimo_dia_individual = p_data
     where id = p_user;

  else
    update public.profiles
       set streak_individual = 1, ultimo_dia_individual = p_data
     where id = p_user;
  end if;
end $$;

-- A pessoa cumpriu a parte dela neste período?
create or replace function public.cumpriu_periodo(p_user uuid, p_period uuid)
returns boolean language plpgsql security definer stable set search_path = public as $$
declare p record; s record; n int; feito boolean := false;
begin
  select * into p from public.squad_periods where id = p_period;
  if p is null then return false; end if;
  select * into s from public.squads where id = p.squad_id;

  if public.is_semanal(s.tipo) then
    -- mandou a foto da semana e confirmou a de todos os outros
    if not exists (select 1 from public.weekly_photos
                    where period_id = p_period and user_id = p_user) then
      return false;
    end if;
    select count(*) into n from public.weekly_photos
     where period_id = p_period and user_id <> p_user;
    feito := (select count(*) from public.photo_confirmations pc
               join public.weekly_photos wp on wp.id = pc.photo_id
              where wp.period_id = p_period and pc.user_id = p_user) >= n;
  else
    if p.autor_id = p_user then
      feito := exists (select 1 from public.posts
                        where period_id = p_period and autor_id = p_user);
    else
      feito := exists (select 1 from public.post_reactions pr
                        join public.posts po on po.id = pr.post_id
                       where po.period_id = p_period and pr.user_id = p_user);
    end if;
  end if;

  return feito;
end $$;

-- Guarda o dia cumprido e mexe no streak pessoal
create or replace function public.registrar_esforco(p_user uuid, p_period uuid)
returns void language plpgsql security definer set search_path = public as $$
declare p record;
begin
  if not public.cumpriu_periodo(p_user, p_period) then return; end if;
  select * into p from public.squad_periods where id = p_period;
  if p is null then return; end if;

  insert into public.dias_cumpridos (user_id, squad_id, period_id, data)
  values (p_user, p.squad_id, p_period, p.data_fim)
  on conflict (user_id, period_id) do nothing;

  if found then
    update public.profiles
       set dias_cumpridos_total = dias_cumpridos_total + 1
     where id = p_user;
  end if;

  perform public.marcar_dia_individual(p_user, p.data_fim);
  perform public.conceder_conquistas(p_user);
end $$;

-- zera quem passou da folga sem cumprir nada
create or replace function public.revisar_streaks_individuais()
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.profiles
     set streak_individual = 0
   where streak_individual > 0
     and ultimo_dia_individual is not null
     and current_date - ultimo_dia_individual > 7;
  get diagnostics n = row_count;
  return n;
end $$;

-- ------------------------------------------------------------
-- 4. Concessão automática das conquistas
-- ------------------------------------------------------------
create or replace function public.conceder_conquistas(p_user uuid)
returns text[] language plpgsql security definer set search_path = public as $$
declare
  novas text[] := '{}';
  streak_max int;
  n_criados int; n_convidados int; n_concluidos int;
  n_amigos int; n_tipos int; n_aceitos int; n_convites int;
  seq boolean; dupla boolean; galera boolean;

begin
  -- dias cumpridos somados ao longo da caminhada
  select coalesce(dias_cumpridos_total, 0) into streak_max
    from public.profiles where id = p_user;

  -- primeiras vezes por tipo
  insert into public.conquistas_usuario (user_id, codigo)
  select p_user, x.codigo from (values
      ('livros','zerando_capitulos'),
      ('oracao','no_secreto'),
      ('leitura_biblica','mestre_da_palavra'),
      ('gdc','buscando_a_lenha'),
      ('jejum','o_foco_e_jesus'),
      ('devocional','enraizados'),
      ('celebracao','tudo_comeca_na_semente')
    ) as x(tipo, codigo)
   where exists (
     select 1 from public.squads s
      join public.squad_members m on m.squad_id = s.id
     where m.user_id = p_user and m.status = 'ativo'
       and s.status = 'concluido' and s.tipo::text = x.tipo)
  on conflict do nothing;

  -- dias cumpridos acumulados
  if streak_max >= 50 then
    insert into public.conquistas_usuario (user_id, codigo)
    values (p_user, 'constantes') on conflict do nothing;
  end if;
  if streak_max >= 100 then
    insert into public.conquistas_usuario (user_id, codigo)
    values (p_user, 'aprovados_pelo_ceu') on conflict do nothing;
  end if;

  -- squads criados e concluídos
  select count(*) into n_criados
    from public.squads where criado_por = p_user and status = 'concluido';
  if n_criados >= 3 then
    insert into public.conquistas_usuario (user_id, codigo)
    values (p_user, 'incendiando_tudo') on conflict do nothing;
  end if;

  select count(*) into n_convidados
    from public.squads s join public.squad_members m on m.squad_id = s.id
   where m.user_id = p_user and m.status = 'ativo'
     and s.status = 'concluido' and s.criado_por <> p_user;
  if n_criados >= 1 and n_convidados >= 2 then
    insert into public.conquistas_usuario (user_id, codigo)
    values (p_user, 'plantando_algo_novo') on conflict do nothing;
  end if;

  -- 10 squads concluídos com mais de 50 amigos diferentes
  select count(distinct s.id) into n_concluidos
    from public.squads s join public.squad_members m on m.squad_id = s.id
   where m.user_id = p_user and m.status = 'ativo' and s.status = 'concluido';

  select count(distinct outros.user_id) into n_amigos
    from public.squad_members meu
    join public.squads s on s.id = meu.squad_id and s.status = 'concluido'
    join public.squad_members outros on outros.squad_id = meu.squad_id
   where meu.user_id = p_user and meu.status = 'ativo' and outros.user_id <> p_user;

  if n_concluidos >= 10 and n_amigos >= 50 then
    insert into public.conquistas_usuario (user_id, codigo)
    values (p_user, 'a_mesa') on conflict do nothing;
  end if;

  -- squad grande finalizado com 100% de streak
  select exists (
    select 1 from public.squads s
     join public.squad_members m on m.squad_id = s.id and m.user_id = p_user and m.status = 'ativo'
    where s.status = 'concluido' and s.total_periodos > 0
      and (select count(*) from public.squad_members mm
            where mm.squad_id = s.id and mm.status = 'ativo') > 5
      and (select count(*) from public.squad_periods sp
            where sp.squad_id = s.id and sp.status = 'concluido') = s.total_periodos
  ) into galera;
  if galera then
    insert into public.conquistas_usuario (user_id, codigo)
    values (p_user, 'que_galera_boa') on conflict do nothing;
  end if;

  -- squad em dupla concluído
  select exists (
    select 1 from public.squads s
     join public.squad_members m on m.squad_id = s.id and m.user_id = p_user and m.status = 'ativo'
    where s.status = 'concluido'
      and (select count(*) from public.squad_members mm
            where mm.squad_id = s.id and mm.status = 'ativo') = 2
  ) into dupla;
  if dupla then
    insert into public.conquistas_usuario (user_id, codigo)
    values (p_user, 'dupla_retete') on conflict do nothing;
  end if;

  -- todas as práticas
  select count(distinct s.tipo) into n_tipos
    from public.squads s join public.squad_members m on m.squad_id = s.id
   where m.user_id = p_user and m.status = 'ativo';
  if n_tipos >= 7 then
    insert into public.conquistas_usuario (user_id, codigo)
    values (p_user, 'de_armadura_completa') on conflict do nothing;
  end if;

  -- começou um squad logo na sequência de outro (até 7 dias depois)
  select exists (
    select 1
      from public.squads novo
      join public.squad_members mn on mn.squad_id = novo.id and mn.user_id = p_user and mn.status='ativo'
      join public.squads velho on velho.id <> novo.id
      join public.squad_members mv on mv.squad_id = velho.id and mv.user_id = p_user and mv.status='ativo'
     where velho.status = 'concluido'
       and novo.data_inicio > velho.data_fim
       and novo.data_inicio - velho.data_fim <= 7
  ) into seq;
  if seq then
    insert into public.conquistas_usuario (user_id, codigo)
    values (p_user, 'mantendo_aceso') on conflict do nothing;
  end if;

  -- convites aceitos e convites enviados
  select count(*) into n_aceitos from public.squad_invites
   where user_id = p_user and status = 'aprovado';
  if n_aceitos >= 5 then
    insert into public.conquistas_usuario (user_id, codigo)
    values (p_user, 'da_galera') on conflict do nothing;
  end if;

  select count(*) into n_convites from public.squad_invites where convidado_por = p_user;
  if n_convites > 80 then
    insert into public.conquistas_usuario (user_id, codigo)
    values (p_user, 'ninguem_sozinho') on conflict do nothing;
  end if;

  select array_agg(codigo) into novas
    from public.conquistas_usuario
   where user_id = p_user and conquistado_em > now() - interval '5 seconds';

  return coalesce(novas, '{}');
end $$;

-- ------------------------------------------------------------
-- 5. Ganchos: período cumprido e ciclo finalizado
-- ------------------------------------------------------------
create or replace function public.avaliar_periodo(p_period uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  p record; s record; membros uuid[]; n int; m uuid;
  qtd_reacoes int; tem_post boolean;
  qtd_fotos int; fotos_ok int; completo boolean := false;
  res jsonb;
begin
  select * into p from public.squad_periods where id = p_period;
  if p is null then return jsonb_build_object('erro','Período não encontrado'); end if;
  select * into s from public.squads where id = p.squad_id;

  select array_agg(user_id) into membros
    from public.squad_members where squad_id = p.squad_id and status = 'ativo';
  n := coalesce(array_length(membros,1),0);
  if n = 0 then return jsonb_build_object('erro','Squad sem membros'); end if;

  if public.is_semanal(s.tipo) then
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

    update public.squads
       set streak_atual   = streak_atual + 1,
           streak_recorde = greatest(streak_recorde, streak_atual + 1),
           selo_dourado   = (streak_atual + 1) >= 7,
           pontos_total   = pontos_total + s.valor_periodo,
           updated_at     = now()
     where id = p.squad_id;

    foreach m in array membros loop
      perform public.conceder_conquistas(m);
    end loop;
  end if;

  select jsonb_build_object(
    'completo', completo, 'streak', sq.streak_atual,
    'selo_dourado', sq.selo_dourado, 'pontos_squad', sq.pontos_total
  ) into res from public.squads sq where sq.id = p.squad_id;

  return res;
end $$;

create or replace function public.finalizar_squad(p_squad uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s record; membros uuid[]; m uuid; total numeric(12,4);
begin
  select * into s from public.squads where id = p_squad;
  if s is null then return jsonb_build_object('erro','Squad não encontrado'); end if;
  if s.pontos_creditados then
    return jsonb_build_object('ja_creditado', true, 'pontos', s.pontos_total);
  end if;
  if s.status = 'cancelado' then
    return jsonb_build_object('erro','Squad encerrado antes do fim. Sem pontos.');
  end if;
  if current_date <= s.data_fim then
    return jsonb_build_object('erro','O ciclo ainda não terminou.');
  end if;

  total := s.pontos_total;
  select array_agg(user_id) into membros
    from public.squad_members where squad_id = p_squad and status = 'ativo';

  update public.squads
     set status = 'concluido', pontos_creditados = true, updated_at = now()
   where id = p_squad;

  if membros is not null then
    foreach m in array membros loop
      if total > 0 then
        insert into public.points_ledger (user_id, squad_id, period_id, pontos, motivo)
        values (m, p_squad, null, total, 'Ciclo concluído')
        on conflict do nothing;
        update public.profiles
           set pontos_total = pontos_total + total, updated_at = now()
         where id = m;
      end if;
      perform public.conceder_conquistas(m);
    end loop;
  end if;

  return jsonb_build_object('creditado', true, 'pontos', total);
end $$;

-- ------------------------------------------------------------
-- 5b. Gatilhos: cada gesto da pessoa conta o dia dela
-- ------------------------------------------------------------
create or replace function public.trg_esforco()
returns trigger language plpgsql security definer set search_path = public as $$
declare pid uuid; quem uuid;
begin
  if tg_table_name = 'posts' then
    pid := new.period_id; quem := new.autor_id;
  elsif tg_table_name = 'post_reactions' then
    select period_id into pid from public.posts where id = new.post_id;
    quem := new.user_id;
  elsif tg_table_name = 'weekly_photos' then
    pid := new.period_id; quem := new.user_id;
  elsif tg_table_name = 'photo_confirmations' then
    select period_id into pid from public.weekly_photos where id = new.photo_id;
    quem := new.user_id;
  end if;

  if pid is not null and quem is not null then
    perform public.registrar_esforco(quem, pid);
  end if;
  return new;
end $$;

drop trigger if exists trg_esforco_post on public.posts;
create trigger trg_esforco_post after insert on public.posts
  for each row execute function public.trg_esforco();

drop trigger if exists trg_esforco_reacao on public.post_reactions;
create trigger trg_esforco_reacao after insert on public.post_reactions
  for each row execute function public.trg_esforco();

drop trigger if exists trg_esforco_foto on public.weekly_photos;
create trigger trg_esforco_foto after insert on public.weekly_photos
  for each row execute function public.trg_esforco();

drop trigger if exists trg_esforco_confirma on public.photo_confirmations;
create trigger trg_esforco_confirma after insert on public.photo_confirmations
  for each row execute function public.trg_esforco();

-- ------------------------------------------------------------
-- 6. Conquistas visíveis no perfil aberto
-- ------------------------------------------------------------
drop policy if exists "vejo minhas conquistas" on public.conquistas_usuario;
create policy "vejo minhas conquistas" on public.conquistas_usuario for select to authenticated
  using (
    user_id = auth.uid()
    or public.sou_admin()
    or exists (select 1 from public.profiles p where p.id = user_id and p.perfil_publico)
  );

-- ------------------------------------------------------------
-- 7. Aplica as regras em quem já está cadastrado
-- ------------------------------------------------------------
-- recalcula os dias cumpridos a partir do que já existe
delete from public.dias_cumpridos;
update public.profiles set dias_cumpridos_total = 0, streak_individual = 0,
                           melhor_streak_individual = 0, ultimo_dia_individual = null;

do $$
declare r record;
begin
  for r in
    select sp.id as period_id, m.user_id
      from public.squad_periods sp
      join public.squad_members m on m.squad_id = sp.squad_id and m.status = 'ativo'
     order by sp.data_fim
  loop
    perform public.registrar_esforco(r.user_id, r.period_id);
  end loop;
end $$;

delete from public.conquistas_usuario;   -- limpa o teste anterior
do $$
declare u record;
begin
  for u in select id from public.profiles loop
    perform public.conceder_conquistas(u.id);
  end loop;
end $$;

-- FIM
